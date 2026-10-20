"""Render the football distance reel: 1080x1920, 30 fps, about 56 s.

Timing comes from vo/timing.json (written by build_vo.py), so every shot
starts when its voiceover line starts. Frames are drawn with Pillow in a
worker pool and piped into ffmpeg. Audio (voiceover, music bed, SFX) is
built with numpy and muxed in at the end.

Usage:
    python3 build_vo.py      # once, to create vo/
    python3 render.py        # full reel -> out/reel.mp4
    python3 render.py --stills   # one PNG per shot -> out/stills/
"""
import bisect
import functools
import json
import math
import os
import random
import subprocess
import sys
import wave
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
VO_DIR = HERE / "vo"
OUT = HERE / "out"

W, H, FPS = 1080, 1920, 30
SR = 44100

LIME = (198, 244, 50)   # #C6F432
DARK = (14, 26, 18)     # #0E1A12
WHITE = (255, 255, 255)
GREY = (154, 163, 160)  # #9AA3A0

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
BOLD = "DejaVuSans-Bold.ttf"
MONO = "DejaVuSansMono-Bold.ttf"

# Burned-in captions, one group per shot, from section 3 of script.md.
CAPTIONS = [
    "FOOTBALLERS RUN WAY FURTHER\nTHAN YOU THINK.",
    "SO HOW FAR DOES ONE PLAYER\nACTUALLY RUN IN A MATCH?",
    "ABOUT 9 TO 11 KILOMETRES.",
    "AROUND THE WHOLE PITCH\nALMOST 30 TIMES.",
    "EVERY. SINGLE. GAME.",
    "CENTRE-BACKS RUN THE LEAST…\nMIDFIELDERS RUN THE MOST.",
    "GUESS HOW FAR THE HARDEST-WORKING PLAYER\nRAN IN ONE WORLD CUP MATCH?",
    "15.1 KILOMETRES!",
    "SPAIN'S RODRI: 90 KM\nOVER THE WHOLE TOURNAMENT…",
    "MORE THAN 2 MARATHONS!",
    "SO WHO RAN THE LEAST?",
    "8.1 PER 90 —\nLAST OF 618 AFTER THE GROUP STAGE.",
    "BUT WHEN HE DOES MOVE…\nIT'S AT EXACTLY THE RIGHT MOMENT.",
    "36.2 KM/H!",
    "BUT HOW FAR DOES A GOALKEEPER RUN?",
    "FOLLOW ALONG!",
]


# ---------------------------------------------------------------- helpers

@functools.lru_cache(maxsize=None)
def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)


def clamp01(x):
    return max(0.0, min(1.0, x))


def lerp(a, b, p):
    return a + (b - a) * p


def ease_in_out(x):
    x = clamp01(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_back(x):
    x = clamp01(x)
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def pop(t, start, span=0.28):
    """Scale 0 -> ~1.1 -> 1 with an ease-out-back overshoot."""
    if t < start:
        return 0.0
    return ease_out_back((t - start) / span)


def roll(t, dur, target):
    """Number roll-up with ease-in-out, used for counters."""
    return target * ease_in_out(t / dur)


@functools.lru_cache(maxsize=None)
def gradient(top, bottom):
    p = np.linspace(0, 1, H)[:, None]
    col = np.array(top)[None, :] * (1 - p) + np.array(bottom)[None, :] * p
    arr = np.broadcast_to(col[:, None, :], (H, W, 3))
    return Image.fromarray(np.ascontiguousarray(arr).astype(np.uint8), "RGB")


def bg(top, bottom):
    return gradient(tuple(top), tuple(bottom)).copy()


def bloom(img, draw_fn, radius=10):
    """Additive glow: draw on a layer, blur it at quarter size, add it back."""
    layer = Image.new("RGB", (W, H), (0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    small = layer.resize((W // 4, H // 4), Image.BILINEAR)
    small = small.filter(ImageFilter.GaussianBlur(radius / 4))
    return ImageChops.add(img, small.resize((W, H), Image.BILINEAR))


def text(d, xy, s, f, fill=WHITE, stroke=0):
    d.text(xy, s, font=f, fill=fill, anchor="mm",
           stroke_width=stroke, stroke_fill=DARK)


def circle(d, c, r, **kw):
    d.ellipse((c[0] - r, c[1] - r, c[0] + r, c[1] + r), **kw)


def pill(s, size=54):
    """Lime label pill with dark outline, rendered as RGBA."""
    f = font(BOLD, size)
    l, t, r, b = ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), s, font=f)
    px, py = int(size * 0.6), int(size * 0.32)
    w, h = r - l + 2 * px, b - t + 2 * py
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=int(size * 0.4),
                        fill=LIME, outline=DARK, width=3)
    d.text((w / 2, h / 2), s, font=f, fill=DARK, anchor="mm")
    return img


def place(base, img, cx, cy, scale=1.0):
    if scale <= 0.02:
        return
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)),
                          max(1, int(img.height * scale))), Image.LANCZOS)
    base.paste(img, (int(cx - img.width / 2), int(cy - img.height / 2)), img)


def pitch_rect(width):
    """Top-down pitch, 105 x 68 m, centred on the frame."""
    length = width * 105 / 68
    x0 = (W - width) / 2
    y0 = (H - length) / 2
    return (x0, y0, x0 + width, y0 + length)


def draw_pitch(d, rect, color, width=4):
    x0, y0, x1, y1 = rect
    sx = (x1 - x0) / 68
    sy = (y1 - y0) / 105
    d.rectangle(rect, outline=color, width=width)
    d.line((x0, (y0 + y1) / 2, x1, (y0 + y1) / 2), fill=color, width=width)
    r = 9.15 * sx
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=width)
    bw, bd = 40.3 * sx, 16.5 * sy
    d.rectangle(((cx - bw / 2), y0, (cx + bw / 2), y0 + bd), outline=color, width=width)
    d.rectangle(((cx - bw / 2), y1 - bd, (cx + bw / 2), y1), outline=color, width=width)


def perimeter_point(rect, p):
    """Point at fraction p (0..1, wraps) around the pitch edge, clockwise."""
    x0, y0, x1, y1 = rect
    w, h = x1 - x0, y1 - y0
    p = p % 1.0
    d = p * 2 * (w + h)
    if d < w:
        return (x0 + d, y0)
    d -= w
    if d < h:
        return (x1, y0 + d)
    d -= h
    if d < w:
        return (x1 - d, y1)
    d -= w
    return (x0, y1 - d)


def draw_arrow(d, a, b, color, width=6, head=26, progress=1.0):
    """Hand-drawn style arrow from a to b; progress draws it on."""
    bx = lerp(a[0], b[0], progress)
    by = lerp(a[1], b[1], progress)
    d.line((a[0], a[1], bx, by), fill=color, width=width)
    if progress > 0.95:
        ang = math.atan2(by - a[1], bx - a[0])
        for s in (2.6, -2.6):
            d.line((bx, by, bx + head * math.cos(ang + s), by + head * math.sin(ang + s)),
                   fill=color, width=width)


# ------------------------------------------------------- stick figures

def run_pose(cx, hy, s, ph):
    """Sprinting figure: hip at (cx, hy), scale s, phase ph in radians."""
    L = 150 * s
    shoulder = (cx, hy - 200 * s)
    head = (cx, hy - 270 * s)
    af = 0.9 * math.sin(ph)
    ab = -af

    def leg(a, lift):
        knee = (cx + L * math.sin(a), hy + L * math.cos(a))
        sa = a * 0.5 - lift
        foot = (knee[0] + L * math.sin(sa), knee[1] + L * math.cos(sa))
        return knee, foot

    knee_f, foot_f = leg(af, 0.3)
    knee_b, foot_b = leg(ab, 0.3 + 0.4 * max(0, math.cos(ph)))
    aa = -af
    elbow_f = (shoulder[0] + 0.8 * L * math.sin(aa), shoulder[1] + 0.8 * L * math.cos(aa))
    hand_f = (elbow_f[0] + 0.7 * L * math.sin(aa + 0.6), elbow_f[1] + 0.7 * L * math.cos(aa + 0.6))
    elbow_b = (shoulder[0] - 0.8 * L * math.sin(aa), shoulder[1] - 0.8 * L * math.cos(aa))
    hand_b = (elbow_b[0] - 0.7 * L * math.sin(aa + 0.6), elbow_b[1] - 0.7 * L * math.cos(aa + 0.6))
    segs = [
        (shoulder, (cx, hy)),
        ((cx, hy), knee_f), (knee_f, foot_f),
        ((cx, hy), knee_b), (knee_b, foot_b),
        (shoulder, elbow_f), (elbow_f, hand_f),
        (shoulder, elbow_b), (elbow_b, hand_b),
    ]
    return head, segs


def draw_figure(d, head, segs, color, width=14, head_r=30):
    for a, b in segs:
        d.line((a[0], a[1], b[0], b[1]), fill=color, width=width, joint="curve")
    circle(d, head, head_r, fill=color)


def particles_along(d, segs, t, color, per=10, r=3, seed=7):
    rnd = random.Random(seed)
    for a, b in segs:
        for k in range(per):
            u = (k + 0.5) / per
            x = lerp(a[0], b[0], u) + rnd.uniform(-14, 14) * math.sin(t * 9 + k)
            y = lerp(a[1], b[1], u) + rnd.uniform(-14, 14) * math.cos(t * 7 + k)
            circle(d, (x, y), r, fill=color)


# --------------------------------------------------------------- shots

def s01_hook(t, d):
    img = bg((8, 18, 12), (14, 26, 18))
    dr = ImageDraw.Draw(img)
    draw_pitch(dr, pitch_rect(860), (34, 62, 44), 3)
    p = ease_in_out(t / d)
    x = lerp(-120, W + 120, p)
    y = 1180 + math.sin(t * 6) * 22
    tail = [(x - k * 46, y - math.sin((t - k * 0.03) * 6) * 22) for k in range(14)]

    def runner(dd):
        dd.line(tail, fill=LIME, width=10, joint="curve")
        circle(dd, (x, y), 26, fill=LIME)
    img = bloom(img, runner, 16)
    dr = ImageDraw.Draw(img)
    runner(dr)
    return img


def s02_scoreboard(t, d):
    img = bg((8, 14, 20), (20, 30, 24))
    dr = ImageDraw.Draw(img)
    for x in (230, 850):
        dr.line((x, 0, x, 300), fill=(70, 80, 76), width=6)
    dr.rounded_rectangle((120, 300, 960, 560), radius=24, fill=(12, 20, 15),
                         outline=LIME, width=6)
    s = "??? KM"
    f = font(MONO, 150)

    def led(dd):
        text(dd, (540, 430), s, f, LIME)
    img = bloom(img, led, 18 + 6 * math.sin(t * 4))
    dr = ImageDraw.Draw(img)
    led(dr)
    # Faint grass across the bottom, reads as the stadium the board hangs over.
    dr.rectangle((0, 1450, W, H), fill=(16, 42, 26))
    return img


def s03_stadium(t, d):
    img = bg((6, 12, 30), (10, 30, 20))
    dr = ImageDraw.Draw(img)
    drop = lerp(-260, 0, ease_in_out(t / d))
    dr.polygon([(0, 1500 + drop), (W, 1500 + drop), (W + 300, H), (-300, H)],
               fill=(18, 62, 32))
    dr.rectangle((0, 1300 + drop, W, 1500 + drop), fill=(20, 40, 28))
    for k in range(4):
        x = (80, 1000)[k % 2]
        y = (60, 480)[k // 2]
        img = bloom(img, lambda dd, x=x, y=y: circle(dd, (x, y), 36, fill=(255, 245, 210)), 40)
    p = pop(t, 0.4)
    place(img, pill("9–11 KM", 130), 540, 900, p)
    return img


def s04_laps(t, d):
    img = bg(DARK, DARK)
    dr = ImageDraw.Draw(img)
    rect = pitch_rect(760)
    draw_pitch(dr, rect, (60, 96, 70), 4)
    lap_time = 0.8 * d
    laps = min(29.0, 29.0 * t / lap_time)
    count = min(29, int(laps) + 1)
    trail = [perimeter_point(rect, laps - k * 0.012) for k in range(60)]

    def draw_trail(dd):
        for k in range(len(trail) - 1):
            fade = 1 - k / len(trail)
            col = tuple(int(c * fade) for c in LIME)
            dd.line((*trail[k], *trail[k + 1]), fill=col, width=12)
        circle(dd, trail[0], 16, fill=LIME)
    img = bloom(img, draw_trail, 20)
    dr = ImageDraw.Draw(img)
    draw_trail(dr)
    # Measurement bracket above the pitch.
    x0, y0, x1, _ = rect
    by = y0 - 60
    dr.line((x0, by, x1, by), fill=GREY, width=4)
    dr.line((x0, by - 16, x0, by + 16), fill=GREY, width=4)
    dr.line((x1, by - 16, x1, by + 16), fill=GREY, width=4)
    place(img, pill("105 × 68 M", 48), 540, by - 6, pop(t, 0.6, 0.3))
    text(dr, (540, 1680), f"{count} LAPS", font(BOLD, 130), LIME, stroke=4)
    return img


def s05_every(t, d):
    img = bg((10, 20, 14), (14, 26, 18))
    dr = ImageDraw.Draw(img)
    words = [("EVERY.", WHITE), ("SINGLE.", WHITE), ("GAME.", LIME)]
    for i, (w, col) in enumerate(words):
        p = pop(t, 0.0 + i * 0.3, 0.22)
        if p <= 0.02:
            continue
        f = font(BOLD, int(190 * p))
        text(dr, (540, 1180 + i * 210), w, f, col, stroke=6)
    return img


FORMATION = {
    "DEF": [(0.15, 0.74), (0.38, 0.76), (0.62, 0.76), (0.85, 0.74)],
    "MID": [(0.28, 0.50), (0.50, 0.46), (0.72, 0.50)],
    "FWD": [(0.20, 0.22), (0.50, 0.18), (0.80, 0.22)],
    "GK": [(0.50, 0.93)],
}


def s06_formation(t, d):
    img = bg((8, 20, 46), (10, 30, 60))
    rect = pitch_rect(760)
    dr = ImageDraw.Draw(img)
    draw_pitch(dr, rect, (60, 100, 140), 4)
    x0, y0, x1, y1 = rect
    rows = [("DEF", 0.5), ("MID", 1.4), ("FWD", 2.3), ("GK", 3.2)]
    lit = {}
    for name, start in rows:
        for nx, ny in FORMATION[name]:
            lit[(nx, ny)] = clamp01((t - start) / 0.3)

    def pos(nx, ny):
        return (x0 + nx * (x1 - x0), y0 + ny * (y1 - y0))

    def dots(dd):
        for (nx, ny), p in lit.items():
            col = tuple(int(lerp(70, c, p)) for c in LIME)
            if p > 0:
                circle(dd, pos(nx, ny), 40 * p, fill=col)
    img = bloom(img, dots, 22)
    dr = ImageDraw.Draw(img)
    for (nx, ny), p in lit.items():
        col = tuple(int(lerp(70, c, p)) for c in LIME)
        circle(dr, pos(nx, ny), 18, fill=col)
    place(img, pill("CB ~9 KM", 46), 330, 1420, pop(t, 1.0))
    place(img, pill("FB ~10 KM", 46), 750, 1420, pop(t, 1.25))
    cm = pos(0.50, 0.46)
    place(img, pill("CM ~11 KM", 46), 800, 1000, pop(t, 1.9))
    draw_arrow(dr, (800, 1040), (cm[0] + 30, cm[1] + 30), LIME, 8, 28,
               progress=clamp01((t - 2.1) / 0.3))
    return img


def s07_quiz(t, d):
    img = bg((40, 120, 200), (170, 220, 240))
    dr = ImageDraw.Draw(img)
    rnd = random.Random(3)
    for _ in range(26):
        bx, by = rnd.uniform(60, W - 60), rnd.uniform(120, 1100)
        ph = rnd.uniform(0, 6.28)
        x = bx + math.sin(t * 1.3 + ph) * 30
        y = by + math.cos(t * 1.7 + ph) * 25
        circle(dr, (x, y - 32), 13, fill=(20, 40, 70))
        dr.rounded_rectangle((x - 18, y - 16, x + 18, y + 26), radius=10, fill=(20, 40, 70))
    chips = ["9", "12", "15.1", "20"]
    for i, val in enumerate(chips):
        p = pop(t, 0.5 + i * 0.35, 0.25)
        if p <= 0.02:
            continue
        cy = 900 + i * 150
        chip = Image.new("RGBA", (480, 120), (0, 0, 0, 0))
        cd = ImageDraw.Draw(chip)
        cd.rounded_rectangle((0, 0, 479, 119), radius=30, fill=WHITE, outline=DARK, width=3)
        cd.ellipse((30, 40, 92, 82), fill=DARK)          # boot icon
        cd.rectangle((58, 26, 80, 48), fill=DARK)
        cd.text((300, 60), val + " KM", font=font(BOLD, 62), fill=DARK, anchor="mm")
        place(img, chip, 540, cy, p)
    text(dr, (900, 1350), "◀ ?", font(BOLD, 70), LIME, stroke=3)
    return img


def s08_odometer(t, d):
    img = bg((10, 20, 14), (20, 34, 24))
    dr = ImageDraw.Draw(img)
    val = roll(t, 0.9 * d, 15.1)
    dr.rounded_rectangle((100, 700, 980, 1190), radius=36, fill=(12, 22, 16),
                         outline=LIME, width=6)
    text(dr, (540, 900), f"{val:.1f}", font(MONO, 260), LIME, stroke=0)
    text(dr, (540, 1080), "KM", font(BOLD, 90), WHITE)
    place(img, pill("TIELEMANS · BEL 3–2 SEN · JOINT RECORD", 30), 540, 1320, pop(t, 0.2))
    # FOLLOW button: the cursor moves in and clicks at about 60% of the shot.
    click = 0.6 * d
    btn_scale = 0.9 if click <= t < click + 0.12 else 1.0
    place(img, pill("FOLLOW", 72), 540, 1560, btn_scale)
    p = clamp01((t - 0.3 * d) / (click - 0.3 * d))
    cx = lerp(860, 600, ease_in_out(p))
    cy = lerp(1700, 1590, ease_in_out(p))
    cursor = [(cx, cy), (cx, cy + 46), (cx + 12, cy + 36), (cx + 22, cy + 56),
              (cx + 30, cy + 52), (cx + 20, cy + 32), (cx + 36, cy + 32)]
    dr.polygon(cursor, fill=WHITE, outline=DARK)
    return img


def s09_rodri(t, d):
    img = bg((30, 40, 30), (10, 16, 12))
    dr = ImageDraw.Draw(img)
    rnd = random.Random(11)
    for _ in range(70):
        x = rnd.uniform(0, W)
        y = (rnd.uniform(0, H) + t * 500) % H
        dr.line((x, y, x + rnd.uniform(-6, 6), y + 90), fill=(34, 96, 46), width=3)
    sway = math.sin(t * 2.2) * 30
    cx = 540 + sway
    dr.ellipse((cx - 180, 980, cx + 80, 1130), fill=(8, 8, 10))   # boot
    dr.rounded_rectangle((cx - 40, 1060, cx + 170, 1180), radius=30, fill=(8, 8, 10))
    dr.rectangle((cx - 140, 1140, cx + 190, 1160), fill=LIME)    # sole stripe
    place(img, pill("RODRI · SPAIN", 60), 540, 520, pop(t, 0.2))
    return img


def s10_road(t, d):
    hy = 900
    img = bg((22, 30, 46), (233, 162, 59))
    dr = ImageDraw.Draw(img)
    dr.polygon([(0, H), (W, H), (560, hy), (520, hy)], fill=(40, 40, 46))
    for k in range(10):
        z = (k * 0.4 + t * 1.8) % 4 + 0.2
        s = 1 / z
        yb = hy + (H - hy) * min(1.0, 0.35 * s)
        dr.line((540, yb, 540, yb + 40 * s), fill=(230, 230, 230), width=max(2, int(18 * s)))
    for i in range(3):
        z = 4.2 - ((t * 1.1 + i * 1.4) % 4.2)
        s = 1 / (z + 0.25)
        w = min(900, 520 * s)
        yb = hy + 120 * s
        if w < 4:
            continue
        lw = max(2, int(14 * min(s, 2)))
        dr.rectangle((540 - w / 2, yb - 0.9 * w, 540 - w / 2 + lw, yb), fill=LIME)
        dr.rectangle((540 + w / 2 - lw, yb - 0.9 * w, 540 + w / 2, yb), fill=LIME)
        dr.arc((540 - w / 2, yb - 1.4 * w, 540 + w / 2, yb - 0.4 * w), 180, 360,
               fill=LIME, width=lw)
    val = roll(t, 0.6 * d, 90.2)
    text(dr, (540, 300), f"{val:.1f}", font(MONO, 200), LIME, stroke=3)
    text(dr, (540, 430), "KM", font(BOLD, 70), WHITE, stroke=3)
    place(img, pill("≈ 2.1 MARATHONS", 64), 540, 560, pop(t, 0.7 * d))
    return img


def s11_moody(t, d):
    img = bg((4, 8, 6), (12, 20, 16))
    fog = Image.new("RGB", (W, H), (0, 0, 0))
    fd = ImageDraw.Draw(fog)
    rnd = random.Random(21)
    for _ in range(14):
        x = rnd.uniform(0, W) + math.sin(t * 0.4 + rnd.random()) * 60
        y = rnd.uniform(500, H) + math.cos(t * 0.3 + rnd.random()) * 40
        r = rnd.uniform(160, 320)
        fd.ellipse((x - r, y - r * 0.6, x + r, y + r * 0.6), fill=(34, 52, 42))
    fog = fog.filter(ImageFilter.GaussianBlur(70))
    img = ImageChops.add(img, fog)
    cone = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(cone).polygon([(470, 0), (610, 0), (950, H), (130, H)], fill=(40, 52, 46))
    cone = cone.filter(ImageFilter.GaussianBlur(40))
    return ImageChops.add(img, cone)


GHOST_SEED = 99


def ghost_field(rect, count=617):
    rnd = random.Random(GHOST_SEED)
    x0, y0, x1, y1 = rect
    field = []
    for _ in range(count):
        field.append((rnd.uniform(x0 + 40, x1 - 40), rnd.uniform(y0 + 40, y1 - 40),
                      rnd.uniform(0.6, 1.4), rnd.uniform(0, 6.28)))
    return field


def ghost_pos(g, t):
    bx, by, sp, ph = g
    return (bx + 40 * math.cos(t * sp * 2 + ph), by + 40 * math.sin(t * sp * 2 + ph))


def s12_messi(t, d):
    img = bg(DARK, DARK)
    dr = ImageDraw.Draw(img)
    rect = pitch_rect(760)
    draw_pitch(dr, rect, (50, 84, 60), 3)
    for g in ghost_field(rect):
        circle(dr, ghost_pos(g, t), 8, fill=(110, 125, 118))
    cx, cy = (rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2
    circle(dr, (cx, cy), 30, fill=LIME)
    text(dr, (cx, cy), "10", font(BOLD, 30), DARK)
    place(img, pill("8.1 KM / 90", 72), 540, 1640, pop(t, 0.3))
    place(img, pill("RANK 618 / 618", 50), 540, 1750, pop(t, 1.0))
    return img


def s13_freeze(t, d):
    img = bg(DARK, DARK)
    dr = ImageDraw.Draw(img)
    rect = pitch_rect(760)
    draw_pitch(dr, rect, (50, 84, 60), 3)
    freeze = min(t, 0.6)
    for g in ghost_field(rect):
        circle(dr, ghost_pos(g, freeze), 8, fill=(110, 125, 118))
    cx, cy = (rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2
    p = ease_in_out(clamp01((t - 0.6) / max(0.01, d - 0.6)))
    path = [(cx + 150 * p * (k / 40), cy - 400 * p * (k / 40)) for k in range(41)]
    head = path[-1]

    def runner(dd):
        for k in range(len(path) - 1):
            fade = (k + 1) / len(path)
            col = tuple(int(c * fade) for c in LIME)
            dd.line((*path[k], *path[k + 1]), fill=col, width=16)
        circle(dd, head, 30, fill=LIME)
    img = bloom(img, runner, 22)
    dr = ImageDraw.Draw(img)
    runner(dr)
    draw_arrow(dr, (cx + 40, cy - 120), (cx + 40 + 120 * p, cy - 120 - 300 * p),
               WHITE, 6, 24, progress=1.0 if p > 0.02 else 0.0)
    return img


def s14_datamode(t, d):
    img = bg((3, 8, 6), (6, 14, 10))
    dr = ImageDraw.Draw(img)
    vanish = (540, 1100)
    scroll = (t * 120) % 60
    for k in range(12):
        y = 1140 + k * 60 + scroll
        if y < H:
            dr.line((0, y, W, y), fill=(20, 60, 40), width=2)
    for x in range(-600, 1700, 160):
        dr.line((vanish[0], vanish[1], x, H), fill=(20, 60, 40), width=2)
    ph = t * 3 * math.pi
    head, segs = run_pose(540, 1120, 1.4, ph)

    def figure_glow(dd):
        draw_figure(dd, head, segs, LIME, 14, 30)
        particles_along(dd, segs, t, LIME, 12, 4)
    img = bloom(img, figure_glow, 20)
    dr = ImageDraw.Draw(img)
    draw_figure(dr, head, segs, LIME, 14, 30)
    particles_along(dr, segs, t, LIME, 12, 4)
    v = lerp(30.0, 36.2, ease_in_out(t / (0.9 * d)))
    text(dr, (540, 380), f"{v:.1f} KM/H", font(MONO, 120), LIME, stroke=3)
    text(dr, (540, 500), "22.5 mph", font(BOLD, 50), GREY)
    place(img, pill("TAGLIAFICO", 56), 540, 1560, pop(t, 0.3))
    return img


def s15_goalkeeper(t, d):
    img = bg((4, 12, 8), (8, 18, 12))
    dr = ImageDraw.Draw(img)
    gx0, gy0, gx1, gy1 = 240, 1000, 840, 1400
    for x in range(gx0, gx1 + 1, 30):
        dr.line((x, gy0, x, gy1), fill=(40, 60, 50), width=2)
    for y in range(gy0, gy1 + 1, 30):
        dr.line((gx0, y, gx1, y), fill=(40, 60, 50), width=2)
    dr.rectangle((gx0, gy0, gx1, gy1), outline=WHITE, width=8)
    # Goalkeeper, arms wide, sways a little.
    sway = math.sin(t * 2) * 12
    cx = 540 + sway
    head = (cx, 1080)
    segs = [((cx, 1140), (cx, 1300)), ((cx, 1300), (cx - 60, 1420)),
            ((cx, 1300), (cx + 60, 1420)),
            ((cx, 1160), (cx - 170, 1080)), ((cx - 170, 1080), (cx - 210, 1000)),
            ((cx, 1160), (cx + 170, 1080)), ((cx + 170, 1080), (cx + 210, 1000))]

    def gk_glow(dd):
        draw_figure(dd, head, segs, LIME, 14, 30)
        orbit = [(cx + math.cos(t * 2 + k * 0.4) * (200 + 40 * math.sin(t * 3 + k)),
                  1200 + math.sin(t * 2 + k * 0.4) * (180 + 30 * math.cos(t * 3 + k)))
                 for k in range(160)]
        for x, y in orbit:
            circle(dd, (x, y), 3, fill=LIME)
    img = bloom(img, gk_glow, 18)
    dr = ImageDraw.Draw(img)
    draw_figure(dr, head, segs, LIME, 14, 30)
    place(img, pill("GOALKEEPERS?", 110), 540, 1600, pop(t, 0.2))
    return img


def s16_cta(t, d):
    img = bg((10, 22, 16), (14, 30, 22))
    dr = ImageDraw.Draw(img)
    draw_pitch(dr, pitch_rect(760), (34, 62, 44), 3)
    click = 1.8
    press = 0.9 if click <= t < click + 0.12 else 1.0
    place(img, pill("FOLLOW", 110), 540, 1100, pop(t, 0.4) * press)
    p = clamp01((t - 1.0) / 0.8)
    cx = lerp(880, 600, ease_in_out(p))
    cy = lerp(1350, 1160, ease_in_out(p))
    dr.polygon([(cx, cy), (cx, cy + 46), (cx + 12, cy + 36), (cx + 22, cy + 56),
                (cx + 30, cy + 52), (cx + 20, cy + 32), (cx + 36, cy + 32)],
               fill=WHITE, outline=DARK)
    return img


SCENES = [s01_hook, s02_scoreboard, s03_stadium, s04_laps, s05_every, s06_formation,
          s07_quiz, s08_odometer, s09_rodri, s10_road, s11_moody, s12_messi,
          s13_freeze, s14_datamode, s15_goalkeeper, s16_cta]


def add_caption(img, i, t):
    d = ImageDraw.Draw(img)
    lines = CAPTIONS[i].split("\n")
    # Shrink the caption until its widest line fits inside the safe width.
    size = 54
    while size > 30:
        f = font(BOLD, size)
        widest = max(d.textbbox((0, 0), s, font=f, stroke_width=4)[2] for s in lines)
        if widest <= 1000:
            break
        size -= 2
    rise = (1 - ease_out_back(clamp01(t / 0.2))) * 20
    top = 768 - (len(lines) - 1) * 32 + rise
    for k, s in enumerate(lines):
        text(d, (540, top + k * 64), s, f, WHITE, stroke=4)
    return img


# --------------------------------------------------------- timeline

def load_timeline():
    timing = json.loads((VO_DIR / "timing.json").read_text())
    slots = [row["slot_seconds"] for row in timing]
    starts = [0.0]
    for s in slots[:-1]:
        starts.append(starts[-1] + s)
    return starts, slots


STARTS, SLOTS = load_timeline()


def render_at(T):
    i = min(len(SCENES) - 1, max(0, bisect.bisect_right(STARTS, T) - 1))
    t = T - STARTS[i]
    img = SCENES[i](t, SLOTS[i])
    return add_caption(img, i, t)


def render_frame(f):
    return render_at(f / FPS).tobytes()


# --------------------------------------------------------------- audio

def read_wav(path):
    with wave.open(str(path), "rb") as w:
        raw = w.readframes(w.getnframes())
        return np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0


def build_audio(total):
    n = int(total * SR)
    vo = np.zeros(n)
    for i, start in enumerate(STARTS, start=1):
        line = read_wav(VO_DIR / f"line_{i:02d}.wav")
        a = int(start * SR)
        vo[a:a + len(line)] += line[: max(0, n - a)]

    music = np.zeros(n)
    beat = 60 / 110
    for k in range(int(total / beat) + 1):
        s0 = int(k * beat * SR)
        L = min(int(0.3 * SR), n - s0)
        if L <= 0:
            break
        tt = np.arange(L) / SR
        kick = np.sin(2 * np.pi * (48 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12)
        music[s0:s0 + L] += 0.55 * kick
        hs = s0 + int(beat * 0.5 * SR)
        Lh = min(int(0.05 * SR), n - hs)
        if Lh > 0:
            noise = np.random.default_rng(k).standard_normal(Lh)
            music[hs:hs + Lh] += 0.07 * np.diff(noise, prepend=0) * np.exp(-np.arange(Lh) / SR * 80)

    chords = [(110.0, 220.0, 261.6, 329.6), (87.3, 174.6, 261.6, 329.6),
              (130.8, 196.0, 261.6, 392.0), (98.0, 196.0, 246.9, 293.7)]
    bar = 4 * beat
    for b, k in enumerate(np.arange(0, total, bar)):
        freqs = chords[b % len(chords)]
        s0 = int(k * SR)
        L = min(int(bar * SR), n - s0)
        if L <= 0:
            break
        tt = np.arange(L) / SR
        env = np.minimum(1, tt / 0.25) * np.minimum(1, (bar - tt) / 0.25).clip(0)
        pad = sum(np.sin(2 * np.pi * f * tt) for f in freqs) / len(freqs)
        music[s0:s0 + L] += 0.09 * pad * env

    # Duck the music under the voiceover: about -10 dB while speech plays.
    env = np.convolve(np.abs(vo), np.ones(int(0.06 * SR)) / int(0.06 * SR), mode="same")
    duck = 1 - 0.7 * np.clip(env * 8, 0, 1)
    music *= duck

    sfx = np.zeros(n)
    for start in STARTS:
        a = int(start * SR)
        L = min(int(0.07 * SR), n - a)
        tt = np.arange(L) / SR
        sfx[a:a + L] += 0.25 * np.sin(2 * np.pi * 1400 * tt) * np.exp(-tt * 60)
    for start in STARTS[1:]:
        a = int(start * SR)
        L = min(int(0.35 * SR), n - a)
        if L <= 0:
            continue
        noise = np.random.default_rng(a).standard_normal(L)
        noise = np.convolve(noise, np.ones(40) / 40, mode="same")
        swell = np.sin(np.linspace(0, np.pi, L)) ** 2
        sfx[a:a + L] += 0.5 * noise * swell

    mix = vo + 0.45 * music + 0.6 * sfx
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.9
    stereo = np.stack([mix, mix], axis=1)
    pcm = (stereo * 32767).astype(np.int16)
    OUT.mkdir(exist_ok=True)
    path = OUT / "audio.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


# ------------------------------------------------------------- output

def stills():
    d = OUT / "stills"
    d.mkdir(parents=True, exist_ok=True)
    for i, scene in enumerate(SCENES):
        T = STARTS[i] + SLOTS[i] * 0.5
        render_at(T).save(d / f"shot_{i + 1:02d}.png")
    print(f"wrote {len(SCENES)} stills to {d}")


def main():
    if "--stills" in sys.argv:
        stills()
        return
    total = sum(SLOTS)
    n_frames = int(round(total * FPS))
    OUT.mkdir(exist_ok=True)
    audio = build_audio(total)
    video_only = OUT / "video_only.mp4"
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         str(video_only)],
        stdin=subprocess.PIPE,
    )
    with Pool(processes=os.cpu_count()) as pool:
        for buf in pool.imap(render_frame, range(n_frames), chunksize=8):
            ff.stdin.write(buf)
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg video encode failed")
    final = OUT / "reel.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(video_only), "-i", str(audio),
         "-map", "0:v", "-map", "1:a", "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
         "-shortest", "-movflags", "+faststart", str(final)],
        check=True,
    )
    video_only.unlink()
    print(f"wrote {final} ({n_frames} frames, {total:.2f}s)")


if __name__ == "__main__":
    main()
