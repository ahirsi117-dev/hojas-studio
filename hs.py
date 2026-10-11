#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hojas Studio 4.0 — استوديو مونتاج بمحرّكه (مجلد engine بجنب هذا الملف، بدون أي مكتبة خارجية).

  python hs.py open   <work> [--engine <مجلد المحرّك>] [--port 8800] [--no-browser]
        يشغّل الخادم بالخلفية ويفتح المتصفح. شغّله أول ما تبدأ المونتاج، حتى قبل ما يجهز أي ملف.
  python hs.py serve  <work> [--engine …] [--port 8800]          الخادم بالواجهة (للتجربة)
  python hs.py say    <work> "وش قاعد أسوي" [--kind step|info|done|ask]   سطر يظهر للمستخدم بالبث الحي
  python hs.py status <work>                                       المراحل + آخر النشاط

  python hs.py brief  <work> ask [--hooks "…" "…"] [--topics "…" "…"] [--note "…"] [--file q.json]
        يفتح للمستخدم صفحة أسئلة قبل المونتاج (بعد التفريغ). ثم:  brief <work> wait   ثم:  brief <work> apply
  python hs.py media  <work> search "query" [--n 8] | add <رقم> --at <ثانية> [--dur 3] [--fit card|cover]     صور برخص حرّة
  python hs.py gen    <work> request image|video "وصف" [--at t] [--fit card|cover] | list | import <رقم> <ملف> [--at t] | rm <رقم>
        بلا مفاتيح API: الطلب ينحفظ، يتولّد من حساب المستخدم (ChatGPT للصور · Gemini للمقاطع)، ثم import يدخّله التايم لاين.
  python hs.py platform [tiktok instagram x linkedin]     وش تحتاج كل منصة (مقاس · مدة · مناطق آمنة · أسلوب)
  python hs.py auto   <work> zooms | transitions [type=curve dir=right] | beats | clear zooms|transitions|beats
  python hs.py caps   <work> regroup [words=6 dur=2.5 pause=0.5] | clean [--dry]     الكابشن على أنفاس الكلام · شيل جمل whisper المخترعة
  python hs.py look   <work> list | apply <اسم> | off           طابع جاهز (ملف سري · كينوت · سينما صامتة · مشربية …)
  python hs.py beat   <work> [ملف | my2] [--at ث]                 يقيس إيقاع الموسيقى (للقص على الضربة)

  python hs.py text   <work> [show | <رقم الجملة> "النص الجديد"]
  python hs.py tr     <work> export | import <file.json>
  python hs.py set    <work> cap.font=Tajawal cap.size=70 en.on=true mix.voice=1.2 …
  python hs.py layer  <work> list | add type=text text="…" s=1 e=4 … | set <id> k=v … | rm <id>
  python hs.py hook   <work> set "صيغة 1" "صيغة 2" … | active <رقم> | off
  python hs.py check  <work>                         فحص الاحتفاظ + الحشو + الجمل المعادة
  python hs.py remove <work> [--cards 3 7] [--ranges 4.2-5.1 …] [--fillers]    يقص من الفيديو والصوت
  python hs.py export <work> [--clean] [--hooks] [--frame 9:16|4:5|1:1|16:9]     التصدير النهائي (نفس زر الاستوديو)
  python hs.py pack   <work>                         حزمة النشر (فيديو + SRT عربي/إنجليزي + نص البوست)
  python hs.py notes  <work> [list | done <id> "وش سويت" | reopen <id>]
  python hs.py brand  <work> list | save <اسم> | apply <اسم>
  python hs.py patch  <work>          يركّب إضافة المحرّك على compose.html (آمن تكراره)
  python hs.py face   <work>                         يحدد مكان الوجه (يشتغل لحاله، هذا للإعادة)
  python hs.py mask   <work> <ث-ث> …                 يجهّز قص الشخص لمدى معيّن (يشتغل لحاله مع type=bg|behind)
  python hs.py sfx    <work> list | add <id> <ث> … | import <ملف أو مجلد> [--name "…"] [--note "…"]   مكتبة الأصوات + أصوات المستخدم
  python hs.py tools                                 وش الأدوات اللي يحتاجها السكل وليش (اعرضها على المستخدم قبل أي تثبيت)
  python hs.py doctor [--engine …]
  python hs.py selftest [<work>]      فحص ذاتي: صياغة الملفات · النصوص العربية سليمة · كل مفاتيح الواجهة موجودة · الخادم يرد
"""
import sys, os, json, time, re, shutil, subprocess, threading, secrets, base64, array, glob, zipfile, difflib, hashlib
import importlib.util, urllib.parse, urllib.request, urllib.error, socket

# ويندوز: الخادم يشتغل بلا نافذة، فأي برنامج يشغّله (ffmpeg · node · bash) كان يفتح نافذة تيرمنال تومض.
# نخلّي كل تشغيل مخفي افتراضياً إلا لو الأمر حدد أعلامه بنفسه.
if os.name == "nt":
    _Popen0 = subprocess.Popen
    class _QuietPopen(_Popen0):
        def __init__(self, *a, **k):
            if not k.get("creationflags"): k["creationflags"] = 0x08000000      # CREATE_NO_WINDOW
            super().__init__(*a, **k)
    subprocess.Popen = _QuietPopen

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace"); sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
os.environ.setdefault("PYTHONUTF8", "1"); os.environ.setdefault("PYTHONIOENCODING", "utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION = "4.0.1"
HOME_CFG = os.path.join(os.path.expanduser("~"), ".hojas-studio")
SNAP_FILES = ("caps.json", "theme.json", "studio.json", "sfx.json", "cut.json")
TAG = '<script src="hs-ext.js"></script>'
PY = sys.executable
FILLERS = ["يعني", "اه", "آه", "أه", "اهه", "امم", "اممم", "ام", "إم", "ممم", "ايه", "إيه", "طيب", "يعنى", "هاه", "ااه", "اا"]
STAGES = [("src", "استلام الفيديو", "Source video"), ("cut", "قص السكتات", "Silence cut"), ("stt", "تفريغ الكلام", "Transcribe"),
          ("caps", "الكابشن", "Captions"), ("video", "القص والزوم", "Cut and zoom"), ("scenes", "المشاهد والموشن", "Scenes"),
          ("render", "الرسم", "Render"), ("final", "الملف النهائي", "Final file")]

# ───────────────────────── أدوات عامة ─────────────────────────
def rj(path, default=None):
    if not os.path.exists(path): return default
    try:
        with open(path, encoding="utf-8") as f: return json.load(f)
    except Exception: return default
def wj(path, obj):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True); tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)
def card_key(c): return " ".join(w["t"] for w in c["w"])
def hs_of(st): return st.setdefault("hs", {})
def J(work, *a): return os.path.join(work, *a)
def load_studio(work): return rj(J(work, "studio.json"), {}) or {}
def new_id(layers): return "L%d" % (max([int(re.sub(r"\D", "", str(l.get("id", "0"))) or 0) for l in layers] or [0]) + 1)

def find_engine(explicit=None):
    """المحرّك جزء من السكل: مجلد engine بجنب hs.py. --engine و HS_ENGINE للتجارب فقط."""
    for c in (explicit, os.environ.get("HS_ENGINE"), os.path.join(HERE, "engine")):
        if c and os.path.isfile(os.path.join(c, "studio", "studio.py")) and os.path.isdir(os.path.join(c, "scripts")):
            return os.path.abspath(c)
    return None
def remember_engine(eng):
    try: os.makedirs(HOME_CFG, exist_ok=True); cfg = rj(os.path.join(HOME_CFG, "config.json"), {}) or {}; cfg["engine"] = eng; wj(os.path.join(HOME_CFG, "config.json"), cfg)
    except Exception: pass

def fix_windows_path():
    """على ويندوز: bash لازم يكون قِت-باش مو WSL، وإلا سكربتات المحرّك تفشل."""
    if os.name != "nt": return
    for d in (r"C:\Program Files\Git\bin", r"C:\Program Files (x86)\Git\bin",
              os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Git", "bin")):
        if os.path.isfile(os.path.join(d, "bash.exe")):
            os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", ""); return

def patch(work, quiet=False):
    """ينسخ الإضافة لمجلد الشغل ويضيف سطرها آخر compose.html. يرجّع True لو غيّر شي، None لو compose ما وُجد بعد."""
    comp = J(work, "compose.html")
    if not os.path.exists(comp):
        if quiet: return None
        sys.exit("ما فيه compose.html بمجلد الشغل: " + work)
    src_ext = os.path.join(HERE, "ext.js"); dst = J(work, "hs-ext.js")
    if not os.path.exists(dst) or open(src_ext, "rb").read() != open(dst, "rb").read(): shutil.copyfile(src_ext, dst)
    src = open(comp, encoding="utf-8").read()
    old = "T('والملف كامل يوصلك على الخاص',540,1370"   # 3.9: السطر الصغير بكرت الختام صار يتعدّل من الاستوديو
    if old in src: src = src.replace(old, "T(OUTRO_T.sub==null?'والملف كامل يوصلك على الخاص':OUTRO_T.sub,540,1370"); open(comp, "w", encoding="utf-8").write(src)
    if TAG in src: return False
    i = src.rfind("</body>")
    src = (src[:i] + TAG + "\n" + src[i:]) if i >= 0 else (src + "\n" + TAG + "\n")
    open(comp, "w", encoding="utf-8").write(src); return True

# ───────────────────────── البث الحي: نشاط + مراحل ─────────────────────────
def act_path(work): return J(work, ".hs", "activity.jsonl")
def say(work, text, kind="info"):
    os.makedirs(J(work, ".hs"), exist_ok=True); p = act_path(work)
    n = sum(1 for _ in open(p, encoding="utf-8")) if os.path.exists(p) else 0
    with open(p, "a", encoding="utf-8") as f:
        f.write(json.dumps({"id": n + 1, "t": int(time.time()), "kind": kind, "text": str(text)[:1200]}, ensure_ascii=False) + "\n")
def activity(work, since=0, limit=80):
    p = act_path(work)
    if not os.path.exists(p): return []
    out = []
    for line in open(p, encoding="utf-8"):
        try: e = json.loads(line)
        except Exception: continue
        if e.get("id", 0) > since: out.append(e)
    return out[-limit:]
def stages(work):
    E = lambda *a: os.path.exists(J(work, *a))
    nvf = len(os.listdir(J(work, "vfr"))) if os.path.isdir(J(work, "vfr")) else 0
    nout = len(os.listdir(J(work, "out"))) if os.path.isdir(J(work, "out")) else 0
    caps = rj(J(work, "caps.json"), None); st = load_studio(work); sfx = rj(J(work, "sfx.json"), {}) or {}
    total = round(((caps or {}).get("total", 0) + sfx.get("outro", 0)) * 30) if caps else 0
    comp = open(J(work, "compose.html"), encoding="utf-8").read() if E("compose.html") else ""
    has_sc = bool([s for s in (st.get("scenes") or []) if s.get("m") not in (None, "R_FULL")]) or "SCENE_LIST.push" in comp.split("SCENE_LIST=[]")[-1][-6000:] or bool((st.get("hs") or {}).get("layers"))
    done = {"src": E("src.mov") or E("cutz.mp4"), "cut": E("cut.json"), "stt": E("a.json") or bool(caps), "caps": bool(caps and caps.get("cards")),
            "video": E("cutz.mp4") and nvf > 0, "scenes": has_sc, "render": total > 0 and nout >= total - 1, "final": E("ad-master.mp4") or E("ad-final.mp4")}
    out = []
    for k, ar, en in STAGES:
        d = {"key": k, "ar": ar, "en": en, "done": bool(done[k])}
        if k == "render" and total and 0 < nout < total - 1: d["pct"] = round(100 * nout / total)
        out.append(d)
    return out
def ready(work): return os.path.exists(J(work, "compose.html")) and bool((rj(J(work, "caps.json"), {}) or {}).get("cards")) and os.path.isdir(J(work, "vfr")) and os.path.exists(J(work, "cutz.mp4"))
def signature(work):
    h = hashlib.md5()
    for f in ("caps.json", "theme.json", "studio.json", "sfx.json", "cut.json", "compose.html", "cutz.mp4", "notes.json", "review.json", "post.txt", "brief.json", "gen.json"):
        p = J(work, f); h.update(("%s:%s;" % (f, int(os.path.getmtime(p) * 10) if os.path.exists(p) else 0)).encode())
    return h.hexdigest()[:12]

# ───────────────────────── تعديل نص جملة ─────────────────────────
def set_card_text(caps, idx, text):
    """يعدّل نص جملة. لو التعديل حذف كلمات فقط، الكلمات الباقية تحتفظ بتوقيتها الحقيقي."""
    c = caps["cards"][idx]; old = c["w"]; words = text.split()
    if not words: raise ValueError("النص فاضي — للحذف استخدم حذف الجملة")
    if len(words) == len(old):
        for w, t in zip(old, words): w["t"] = t
        return
    if len(words) < len(old):                       # حذف فقط؟ طابق الباقي بالترتيب
        j = 0; keep = []
        for w in old:
            if j < len(words) and w["t"] == words[j]: keep.append(w); j += 1
        if j == len(words): c["w"] = keep; return
    s0, e1 = old[0]["s"], old[-1]["e"]; span = max(0.12 * len(words), e1 - s0)
    tot = sum(len(w) + 1 for w in words); acc = 0.0; out = []
    hot = {w["t"]: w for w in old if w.get("hot") or w.get("fx")}
    for w in words:
        d = span * (len(w) + 1) / tot
        n = {"t": w, "s": round(s0 + acc, 3), "e": round(s0 + acc + d, 3), "hot": False}
        if w in hot:
            n["hot"] = bool(hot[w].get("hot"))
            if hot[w].get("fx"): n["fx"] = hot[w]["fx"]
        out.append(n); acc += d
    c["w"] = out

def apply_text(work, i, text):
    cp = J(work, "caps.json"); sp = J(work, "studio.json")
    caps = rj(cp); old = card_key(caps["cards"][i]); new = " ".join(str(text).split())
    set_card_text(caps, i, new); wj(cp, caps)
    st = load_studio(work); hs = hs_of(st); ed = hs.setdefault("edits", {})
    src = next((k for k, v in ed.items() if v == old), old); ed[src] = new
    mp = (hs.get("en") or {}).get("map") or {}
    if old in mp and new != old: mp[new] = mp.pop(old)
    ov = hs.get("capOv") or {}
    if old in ov and new != old: ov[new] = ov.pop(old)
    wj(sp, st); return caps, hs

# ───────────────────────── الفحص: احتفاظ + حشو + إعادات ─────────────────────────
def _norm(w):
    w = re.sub(r"[\u064B-\u0652\u0640]", "", w)
    w = w.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
    return re.sub(r"[^\w]", "", w)
_STOP = {"في", "من", "علي", "الي", "عن", "مع", "هذا", "هذي", "هذه", "ذلك", "اللي", "الي", "و", "او", "ثم", "بس", "يا", "ان", "ما", "لا", "كل", "كان", "صار", "هو", "هي"}
def _sim(a, b):
    wa, wb = [w for w in a if w not in _STOP], [w for w in b if w not in _STOP]
    if not wa or not wb: return 0.0
    shared = len(set(wa) & set(wb)) / min(len(wa), len(wb))
    return max(shared, difflib.SequenceMatcher(None, " ".join(a), " ".join(b)).ratio())
_PV = {"busy": False}
def pv_build(work):
    """يبني فريمات المعاينة المصغّرة بالخلفية مرة وحدة (ويعيدها لو تغيّر القص)."""
    if _PV["busy"] or not shutil.which("ffmpeg"): return
    _PV["busy"] = True
    def go():
        try:
            out = J(work, ".hs", "pv"); os.makedirs(out, exist_ok=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-start_number", "1", "-i", J(work, "vfr", "%05d.jpg"), "-vf", "scale=540:-2", "-q:v", "5", "-start_number", "1", os.path.join(out, "%05d.jpg")], capture_output=True)
            n = len(glob.glob(J(work, "vfr", "*.jpg")))
            for f in glob.glob(os.path.join(out, "*.jpg")):
                if int(re.sub(r"\D", "", os.path.basename(f)) or 0) > n: os.remove(f)
        finally: _PV["busy"] = False
    threading.Thread(target=go, daemon=True).start()
def vsig(work):
    try: return "%x" % int(os.path.getmtime(J(work, "cutz.mp4")) * 10)
    except OSError: return "0"
def keep_seams(work):
    keep = (rj(J(work, "cut.json"), {}) or {}).get("keep") or []; acc = 0.0; out = []
    for a, b in keep[:-1]: acc += b - a; out.append(round(acc, 3))
    return out
def check(work):
    caps = rj(J(work, "caps.json"), {"cards": [], "total": 0}); cards = caps["cards"]; total = caps.get("total", 0)
    st = load_studio(work); hs = st.get("hs") or {}; cfg = hs.get("check") or {}
    gap = float(cfg.get("gap", 2.5)); maxw = int(cfg.get("maxWords", 10)); extra = [_norm(x) for x in (cfg.get("fillers") or [])]
    fl = set(_norm(x) for x in FILLERS) | set(extra)
    fillers = [{"card": i, "idx": j, "t": w["t"], "s": w["s"], "e": w["e"]} for i, c in enumerate(cards) for j, w in enumerate(c["w"]) if _norm(w["t"]) in fl and len(c["w"]) > 1]
    dupes = []
    for i in range(len(cards) - 1):
        for j in range(i + 1, min(i + 3, len(cards))):
            r = _sim([_norm(w["t"]) for w in cards[i]["w"]], [_norm(w["t"]) for w in cards[j]["w"]])
            if r >= 0.60: dupes.append({"a": i, "b": j, "r": round(r, 2)}); break
    ev = [0.0] + keep_seams(work)                                   # كل لحمة قص = تغيّر زوم
    for s in st.get("scenes") or []: ev += [s.get("s", 0)]
    for k in ("brollClips", "stickers"):
        for b in st.get(k) or []: ev += [b.get("s", 0), b.get("e", 0)]
    for L in hs.get("layers") or []:
        if L.get("off"): continue
        ev += [L.get("s", 0)] + ([] if L.get("type") == "fx" else [L.get("e", 0)])
    hk = hs.get("hooks") or {}
    if hk.get("on") and hk.get("items"): ev += [0.0, hk.get("dur", 2.6)]
    if cfg.get("caps"): ev += [c["s"] for c in cards]
    ev = sorted(set(round(x, 2) for x in ev if 0 <= x < total)) + [total]
    gaps = [{"s": a, "e": b, "d": round(b - a, 2)} for a, b in zip(ev, ev[1:]) if b - a > gap]
    long_caps = [{"card": i, "n": len(c["w"])} for i, c in enumerate(cards) if len(c["w"]) > maxw]
    first = cards[0]["w"][0]["s"] if cards else None
    issues = len(gaps) + len(long_caps) + (1 if (first is not None and first > 1.0) else 0)
    score = max(0, 100 - 6 * len(gaps) - 4 * len(long_caps) - (15 if (first is not None and first > 1.0) else 0) - int(sum(g["d"] - gap for g in gaps) * 2))
    try: tips = flow_tips(work, ev, total, hs)
    except Exception: tips = []
    return {"gap": gap, "words": maxw, "fillers": fillers, "dupes": dupes, "gaps": gaps, "longCaps": long_caps, "firstCap": first, "issues": issues, "score": score, "total": total, "tips": tips}

# ───────────────────────── قص مقاطع من الفيديو (حشو · إعادات · بليد) ─────────────────────────
def snapshot(work, name):
    vid = time.strftime("%Y%m%d-%H%M%S"); vd = J(work, ".hs", "versions", vid); n = 1
    while os.path.exists(vd): vd = J(work, ".hs", "versions", vid + "-%d" % n); n += 1
    os.makedirs(vd)
    for f in SNAP_FILES:
        if os.path.exists(J(work, f)): shutil.copy(J(work, f), os.path.join(vd, f))
    wj(os.path.join(vd, "meta.json"), {"name": (name or "نسخة")[:60], "at": time.strftime("%Y-%m-%d %H:%M")}); return os.path.basename(vd)

def run(cmd, log, cwd=None, check=True, env=None):
    log("$ " + " ".join(os.path.basename(str(c)) if os.sep in str(c) else str(c) for c in cmd)[:220])
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd, env=env, encoding="utf-8", errors="replace")
    out = ((r.stdout or "") + (r.stderr or "")).strip()
    if out: log(out[-700:])
    if check and r.returncode: raise RuntimeError(os.path.basename(str(cmd[1] if len(cmd) > 1 else cmd[0])) + " فشل: " + out[-300:])
    return r

def rebuild_video(work, S, log):
    log("أقص وأركّب الفيديو من جديد…"); run([PY, os.path.join(S, "03_cut_zoom.py"), work], log, cwd=work)
    log("أطلّع الفريمات…"); shutil.rmtree(J(work, "vfr"), ignore_errors=True); os.makedirs(J(work, "vfr"))
    run(["ffmpeg", "-v", "error", "-i", J(work, "cutz.mp4"), "-vf", "fps=30", "-q:v", "3", "-y", J(work, "vfr", "%05d.jpg")], log, cwd=work)
    for f in ("behind.json", "sfx.wav"):
        try: os.remove(J(work, f))
        except FileNotFoundError: pass
    shutil.rmtree(J(work, "bt"), ignore_errors=True); shutil.rmtree(J(work, "out"), ignore_errors=True); vision_reset(work)

def remove_ranges(work, S, log, ranges=(), cards=(), words=(), rebuild=True):
    """يشيل مقاطع (بزمن الإخراج) من الفيديو والصوت، ويزحّف كل شي بعدها: الكابشن · المؤثرات · المشاهد · الطبقات."""
    caps = rj(J(work, "caps.json")); cs = caps["cards"]; total = caps["total"]; iv = []
    for a, b in ranges: iv.append([max(0.0, float(a)), min(total, float(b))])
    drop_cards = set(int(i) for i in cards); drop_words = set((int(i), int(j)) for i, j in words)
    for i in sorted(drop_cards):
        c = cs[i]; a = max(0.0, c["w"][0]["s"] - 0.08); b = min(total, c["w"][-1]["e"] + 0.12)
        if i + 1 < len(cs): b = min(b, cs[i + 1]["w"][0]["s"] - 0.02)
        if i > 0: a = max(a, cs[i - 1]["w"][-1]["e"] + 0.02)
        if b > a: iv.append([a, b])
    for i, j in sorted(drop_words):
        if i in drop_cards: continue
        ws = cs[i]["w"]; w = ws[j]
        a = ws[j - 1]["e"] if j > 0 else max(0.0, w["s"] - 0.04)
        b = ws[j + 1]["s"] if j + 1 < len(ws) else min(total, w["e"] + 0.04)
        a = min(a, w["s"]); b = max(b, w["e"]); a = max(a, w["s"] - 0.25); b = min(b, w["e"] + 0.25)
        if b > a: iv.append([a, b])
    iv = sorted(x for x in iv if x[1] - x[0] > 0.03); merged = []
    for a, b in iv:
        if merged and a - merged[-1][1] < 0.05: merged[-1][1] = max(merged[-1][1], b)
        else: merged.append([a, b])
    if not merged: raise ValueError("ما فيه شي ينشال")
    gone = sum(b - a for a, b in merged)
    if total - gone < 1.0: raise ValueError("بيبقى أقل من ثانية — ما أقدر أشيل كل هذا")
    snapshot(work, "قبل القص (تلقائي)")
    shift = lambda t: round(t - sum(min(t, b) - a for a, b in merged if a < t), 3)
    inside = lambda t: any(a - 1e-6 <= t <= b + 1e-6 for a, b in merged)
    cut = rj(J(work, "cut.json")); keep = [list(x) for x in cut["keep"]]; off = []; acc = 0.0
    for a, b in keep: off.append(acc); acc += b - a
    src_del = []
    for ds, de in merged:
        for i, (a, b) in enumerate(keep):
            s0, s1 = off[i], off[i] + (b - a); lo, hi = max(ds, s0), min(de, s1)
            if hi > lo: src_del.append([a + (lo - s0), a + (hi - s0)])
    new_keep = []
    for a, b in keep:
        parts = [[a, b]]
        for ds, de in src_del:
            o = []
            for x, y in parts:
                if de <= x or ds >= y: o.append([x, y]); continue
                if ds > x: o.append([x, ds])
                if de < y: o.append([de, y])
            parts = o
        new_keep += [[round(p[0], 4), round(p[1], 4)] for p in parts if p[1] - p[0] >= 0.12]
    cut["keep"] = new_keep; cut["total"] = round(sum(b - a for a, b in new_keep), 3); wj(J(work, "cut.json"), cut)
    new_cards = []
    for i, c in enumerate(cs):
        if i in drop_cards: continue
        ws = [w for j, w in enumerate(c["w"]) if (i, j) not in drop_words and not inside((w["s"] + w["e"]) / 2)]
        if not ws: continue
        ws = [{**w, "s": shift(w["s"]), "e": max(shift(w["e"]), shift(w["s"]) + 0.08)} for w in ws]
        new_cards.append({"s": max(0.0, min(shift(c["s"]), ws[0]["s"])), "e": max(shift(c["e"]), ws[-1]["e"]), "w": ws})
    for i in range(len(new_cards) - 1):
        if new_cards[i]["e"] > new_cards[i + 1]["s"]: new_cards[i]["e"] = round(max(new_cards[i]["w"][-1]["e"], new_cards[i + 1]["s"] - 0.02), 3)
    new_total = round(min(total - gone, cut["total"]), 3); wj(J(work, "caps.json"), {"total": new_total, "cards": new_cards})
    sfx = rj(J(work, "sfx.json"), None)
    if sfx is not None:
        for k, v in list(sfx.items()):
            if isinstance(v, list): sfx[k] = [([shift(t[0])] + list(t[1:])) if isinstance(t, list) else shift(t) for t in v if not inside(t[0] if isinstance(t, list) else t)]
        wj(J(work, "sfx.json"), sfx)
    st = load_studio(work); hs = hs_of(st)
    def mv(arr):
        o = []
        for x in arr or []:
            s, e = shift(x.get("s", 0)), shift(x.get("e", 0))
            if e - s > 0.15: o.append({**x, "s": s, "e": e})
        return o
    if st.get("scenes"):
        sc = mv(st["scenes"])
        if sc: sc[0]["s"] = 0
        if sc and st["scenes"][-1].get("e", 0) >= total - 0.05: sc[-1]["e"] = new_total + 5
        st["scenes"] = sc
    for k in ("stickers", "brollClips"):
        if st.get(k): st[k] = mv(st[k])
    if hs.get("layers"): hs["layers"] = mv(hs["layers"])
    st["behindOff"] = []; wj(J(work, "studio.json"), st)
    log("انشال %.2f ثانية: المدة %.2f ← %.2f" % (gone, total, new_total))
    if rebuild: rebuild_video(work, S, log)
    return {"gone": round(gone, 2), "total": new_total}

# ───────────────────────── المنصات والمقاسات (3.1) ─────────────────────────
# safe = نسبة من كل حافة تغطيها واجهة المنصة [فوق، تحت، يسار، يمين]. أرقام تيك توك وانستقرام من أدلة المقاسات المنشورة، وإكس ولينكدإن تقدير محافظ.
PLATFORMS = {
    "tiktok": {"ar": "تيك توك", "frames": ["9:16"], "safe": [8, 22, 6, 13], "max": "10 دقايق من التطبيق · 60 دقيقة رفع", "best": "20-45 ثانية",
               "tips": ["الهوك في أول ثانية ونص: جملة أو حركة توقف الإصبع، بلا مقدمة ولا شعار", "تغيير بصري كل 2-3 ثواني (قطع · زوم · صورة · نص)",
                        "الكابشن على الشاشة أساسي وكلمات البحث تنقال وتنكتب (تيك توك محرك بحث)", "الختام يرجّع لأول المقطع أو يطلب تعليق، لأن الإعادة والإكمال أهم إشارتين",
                        "لا تحط نص تحت 78% من الارتفاع ولا بآخر 13% يمين (أزرار الإعجاب والوصف)"]},
    "instagram": {"ar": "انستقرام", "frames": ["9:16", "4:5"], "safe": [12, 32, 6, 11], "max": "الريلز لين 3 دقايق عشان ينقترح لناس جدد", "best": "15-45 ثانية",
                  "tips": ["أهم إشارة المشاركة بالخاص: اصنع لحظة تستاهل تنرسل لصديق", "العنوان والوجه في وسط الكادر، لأن شبكة الحساب تقص المقطع 3:4",
                           "الكابشن أعلى من تيك توك: لا تنزل تحت 68% من الارتفاع (الوصف والصوت يغطون آخر 32%)", "بلا علامة مائية من أي تطبيق ثاني، وجودة نظيفة",
                           "غلاف واضح بعنوان مقروء لأنه يظهر في الشبكة"]},
    "x": {"ar": "إكس", "frames": ["16:9", "1:1", "9:16"], "safe": [6, 10, 5, 5], "max": "140 ثانية للحساب العادي · أطول للمشترك", "best": "15-45 ثانية",
          "tips": ["المقطع يشتغل صامت بالتايم لاين: الفكرة لازم تنفهم من النص على الشاشة من أول فريم", "رأي واضح أو معلومة محددة من أول جملة، بلا تمهيد",
                   "العرضي 16:9 والمربع 1:1 يطلعون أكبر في التايم لاين على الكمبيوتر، والعمودي أحسن بالجوال", "لا تتعدى 140 ثانية لو الحساب مو مشترك، وإلا ما ينرفع",
                   "نص التغريدة يشيل نص السياق والمقطع يشيل الإثبات"]},
    "linkedin": {"ar": "لينكدإن", "frames": ["4:5", "1:1", "9:16"], "safe": [6, 12, 5, 5], "max": "10 دقايق للمنشور العادي", "best": "30-90 ثانية",
                 "tips": ["نبرة مهنية وفائدة مباشرة: درس · رقم · تجربة شغل، بلا ترندات ولا موسيقى صاخبة", "أول جملة تقول وش بيستفيد المشاهد، والإيقاع أهدأ من تيك توك",
                          "4:5 أو 1:1 ياخذ مساحة أكبر بالفيد من العرضي", "الكابشن المحروق أساسي لأن أغلبهم يشوف بلا صوت بالدوام",
                          "الختام سؤال يفتح نقاش بالتعليقات، مو «تابعني»"]},
}
FRAMES = {"9:16": (1080, 1920), "4:5": (1080, 1350), "1:1": (1080, 1080), "16:9": (1920, 1080)}
def frame_of(hs): f = (hs.get("frame") or {}); ar = f.get("ar") if f.get("ar") in FRAMES else "9:16"; return ar, float(f.get("cy", 0.47))
def crop_y0(ar, cy): h = FRAMES[ar][1]; return int(max(0, min(1920 - h, round(cy * 1920 - h / 2)))) // 2 * 2
def safe_of(plats, ar="9:16", cy=0.47):
    """أشد حدود آمنة للمنصات المختارة + حدود القص لو المقاس مو 9:16. ترجع نسب من الكادر العمودي الكامل."""
    z = [6, 10, 5, 5]
    for n in plats or []:
        if n in PLATFORMS: z = [max(a, b) for a, b in zip(z, PLATFORMS[n]["safe"])]
    crop = None
    if ar in ("4:5", "1:1"):
        y0 = crop_y0(ar, cy); h = FRAMES[ar][1]; crop = [round(y0 / 19.2, 2), round((y0 + h) / 19.2, 2)]
        z = [6, 10, 5, 5]                                   # بعد القص حدود المنصة تنحسب من الكادر المقصوص
    lo = (crop[0] if crop else 0) + z[0] * ((crop[1] - crop[0]) / 100 if crop else 1)
    hi = (crop[1] if crop else 100) - z[1] * ((crop[1] - crop[0]) / 100 if crop else 1)
    return {"zone": z, "crop": crop, "capMin": round(lo + 6, 1), "capMax": round(hi - 1, 1), "ar": ar, "platforms": [n for n in plats or [] if n in PLATFORMS]}
def platform_text(names=None):
    L = []
    for n in (names or list(PLATFORMS)):
        P_ = PLATFORMS.get(n)
        if not P_: continue
        L.append("◆ %s: المقاس %s · المدة المسموحة %s · الأنسب %s · مناطق مغطاة (فوق %d%% · تحت %d%% · يسار %d%% · يمين %d%%)" % (P_["ar"], " أو ".join(P_["frames"]), P_["max"], P_["best"], *P_["safe"]))
        L += ["    - " + x for x in P_["tips"]]
    return "\n".join(L)
def reframe(work, src, ar, cy, log=print):
    """يطلّع نسخة بمقاس ثاني من الماستر العمودي. 4:5 و1:1 قص · 16:9 المقطع بالنص وخلفية مغبّشة منه."""
    if ar == "9:16" or ar not in FRAMES: return None
    out = J(work, "ad-%s.mp4" % ar.replace(":", "x")); w, h = FRAMES[ar]
    if ar == "16:9": fc = "[0:v]split[a][b];[a]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=28:3,eq=brightness=-0.14[bg];[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0,format=yuv420p[v]"
    else: fc = "[0:v]crop=%d:%d:0:%d,format=yuv420p[v]" % (w, h, crop_y0(ar, cy))
    log("نسخة بمقاس %s…" % ar)
    run(["ffmpeg", "-v", "error", "-nostats", "-i", src, "-filter_complex", fc, "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "30", "-c:a", "copy", "-movflags", "+faststart", "-y", out], log)
    return os.path.basename(out)

# ───────────────────────── التصدير ─────────────────────────
CLEAN_AF = "highpass=f=80,afftdn=nf=-28:nt=w,acompressor=threshold=-18dB:ratio=3:attack=8:release=120,"
def render_frames(work, S, log, rng=None):
    try: vision_ensure(work, log)
    except Exception as e: log("تنبيه: ما قدرت أجهّز قص الشخص أو مكان الوجه (%s). التصدير يكمل بدونها." % str(e)[:120])
    cmd = ["node", os.path.join(S, "04_render_frames.js"), work] + (["range", str(rng[0]), str(rng[1])] if rng else ["all", "--force"])
    log("$ 04_render_frames.js " + " ".join(cmd[3:]))
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace"); ok = False
    for line in p.stdout:
        if "Failed to load resource" in line: continue
        log(line.rstrip())
        if "فريم مرسوم من" in line: ok = True; time.sleep(1.5); p.kill(); break
    p.wait()
    if not ok: raise RuntimeError("الرسم ما اكتمل — شوف السجل")
# ───────────────────────── 3.8: العين (مكان الوجه + قناع الشخص) ─────────────────────────
# كله محلي: engine/scripts/21_vision.js يشغّل كروم بلا واجهة على فريمات المشروع، بموديلات داخل engine/vision. ما يطلع شي من الجهاز.
def vision_run(work, args, log=print):
    eng = find_engine(None)
    if not eng: raise RuntimeError("ما لقيت مجلد engine")
    return run(["node", os.path.join(eng, "scripts", "21_vision.js"), work] + [str(x) for x in args], log, check=False).returncode == 0
def _nvf(work):
    try: return len([f for f in os.listdir(J(work, "vfr")) if f.endswith(".jpg")])
    except OSError: return 0
def mask_ranges(work):
    try: return json.loads(open(J(work, "hs-mask.js"), encoding="utf-8").read().split("=", 1)[1].rstrip().rstrip(";")).get("ranges") or []
    except Exception: return []
def mask_need(work):
    """المدى (بالثواني) لكل طبقة خلفية أو نص خلف الشخص ما له قناع كامل."""
    n = _nvf(work); have = mask_ranges(work); need = []
    if not n: return need
    for L in ((load_studio(work).get("hs") or {}).get("layers") or []):
        if L.get("type") not in ("bg", "behind") or L.get("off"): continue
        try: a, b = float(L["s"]), float(L["e"])
        except Exception: continue
        f0 = max(1, int(a * 30) + 1); f1 = min(n, int(b * 30 + 0.999) + 1)
        if f1 >= f0 and not any(r[0] <= f0 and r[1] >= f1 for r in have): need.append("%.2f-%.2f" % (a, b))
    return need
def face_stale(work):
    fj = J(work, "face.json"); src = J(work, "cutz.mp4")
    if not _nvf(work): return False
    try: return (not os.path.exists(fj)) or (os.path.exists(src) and os.path.getmtime(fj) < os.path.getmtime(src))
    except OSError: return True
def vision_ensure(work, log=print):
    """يجهّز الناقص فقط: مكان الوجه + أقنعة الطبقات اللي تحتاجها. يرجّع قائمة اللي سواه."""
    did = []
    if face_stale(work):
        log("أحدد مكان الوجه عشان الكروت ما تقص وجهه…"); did.append("face" if vision_run(work, ["face"], log) else "face!")
    need = mask_need(work)
    if need:
        log("أقص الشخص عن الخلفية للمدى: " + " · ".join(need)); did.append("mask" if vision_run(work, ["mask"] + need, log) else "mask!")
    return did
def vision_reset(work):
    shutil.rmtree(J(work, "mk"), ignore_errors=True)
    for f in ("hs-mask.js", "face.json", "hs-face.js"):
        try: os.remove(J(work, f))
        except OSError: pass

# ───────────────────────── 3.8: أصوات المستخدم ─────────────────────────
# يحط ملفاته في ~/.hojas-studio/my-sounds (أو يرفعها من الاستوديو). تتحول wav وتاخذ رقماً يبدأ بـ my، وتنستخدم مثل أصوات المكتبة.
AUD_EXT = (".wav", ".mp3", ".m4a", ".aac", ".ogg", ".flac", ".opus", ".wma", ".aif", ".aiff")
def my_dir(): d = os.path.join(HOME_CFG, "my-sounds"); os.makedirs(d, exist_ok=True); return d
def my_meta_path(): return os.path.join(HOME_CFG, "my-sounds.json")
def my_list(sync=True):
    meta = [m for m in (rj(my_meta_path(), []) or []) if isinstance(m, dict) and m.get("id")]; ch = False
    if sync:
        files = sorted(f for f in os.listdir(my_dir()) if f.lower().endswith(AUD_EXT)); known = {m.get("file") for m in meta}
        keep = [m for m in meta if m.get("file") in files and sfx_have(m["id"])]
        if len(keep) != len(meta):
            for m in meta:
                if m not in keep:
                    try: os.remove(sfx_path(m["id"]))
                    except OSError: pass
            meta = keep; ch = True
        for f in files:
            if f in known: continue
            nid = "my%d" % (max([int(re.sub(r"\D", "", m["id"]) or 0) for m in meta] or [0]) + 1); src = os.path.join(my_dir(), f)
            try:
                r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", "48000", sfx_path(nid)], capture_output=True)
                if r.returncode or not sfx_have(nid): continue
                pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", sfx_path(nid)], capture_output=True, text=True)
                d = round(float((pr.stdout or "0").strip() or 0), 1)
            except Exception: continue
            meta.append({"id": nid, "name": os.path.splitext(f)[0][:60], "file": f, "dur": d, "note": ""}); ch = True
        if ch: wj(my_meta_path(), meta)
    return meta
def my_import(src, name=None, note=""):
    if not os.path.isfile(src) or not src.lower().endswith(AUD_EXT): raise ValueError("مو ملف صوت: " + src)
    base = re.sub(r"[^\w.\- ]+", "_", os.path.basename(src)); dst = os.path.join(my_dir(), base)
    if os.path.abspath(src) != os.path.abspath(dst): shutil.copy(src, dst)
    meta = my_list(); m = next((x for x in meta if x.get("file") == base), None)
    if not m: raise RuntimeError("ما قدرت أقرأ الصوت: " + base)
    if name: m["name"] = name[:60]
    if note: m["note"] = note[:200]
    wj(my_meta_path(), meta); return m
def my_edit(i, name=None, note=None, delete=False):
    meta = my_list(False); m = next((x for x in meta if x["id"] == i), None)
    if not m: return meta
    if delete:
        for f in (sfx_path(i), os.path.join(my_dir(), m.get("file") or "-")):
            try: os.remove(f)
            except OSError: pass
        meta = [x for x in meta if x["id"] != i]
    else:
        if name is not None: m["name"] = str(name)[:60] or m["name"]
        if note is not None: m["note"] = str(note)[:200]
    wj(my_meta_path(), meta); return meta
def sfx_all():
    """مكتبة السكل + أصوات المستخدم بشكل واحد."""
    out = [dict(x, have=sfx_have(x["id"])) for x in sfx_lib()]
    for m in my_list(): out.append({"id": m["id"], "ar": m["name"], "en": m["name"], "dur": "%ss" % m.get("dur", 0), "have": True, "mine": True, "note": m.get("note", ""), "long": float(m.get("dur") or 0) > 8})
    return out

# ───────────────────────── 3.8: وش يتثبّت وليش (شفافية) ─────────────────────────
TOOLS = [
    ("ffmpeg", "يقص الفيديو ويركّب الصوت والصورة ويطلّع الملف النهائي", "برنامج مفتوح المصدر معروف (ffmpeg.org) · 90 ميقا تقريباً", lambda: bool(shutil.which("ffmpeg"))),
    ("Python + whisper", "يفرّغ كلامك لنص بتوقيت كل كلمة عشان الكابشن", "مكتبة OpenAI المفتوحة (openai-whisper) وموديلها ينزل مرة وحدة 1.4 قيقا · يشتغل على جهازك وصوتك ما ينرفع لأي مكان", lambda: importlib.util.find_spec("whisper") is not None),
    ("Node.js + puppeteer-core", "يشغّل متصفح كروم بدون نافذة عشان يرسم الكابشن والكروت فريم فريم", "Node من nodejs.org و puppeteer-core من قوقل (مكتبة تحكم بالمتصفح) · ما يفتح مواقع ولا يدخل حساباتك", lambda: bool(shutil.which("node"))),
    ("Google Chrome أو Edge", "نفس المتصفح اللي عندك، يُستخدم كمحرّك رسم فقط", "ما يتثبّت شي جديد لو عندك واحد منهم", lambda: True),
    ("Git for Windows", "على ويندوز فقط: يشغّل سكربتات التجميع (bash)", "من git-scm.com", lambda: os.name != "nt" or bool(shutil.which("bash"))),
]
NET_USE = [
    "خطوط Google: ينزّل ملف الخط اللي تختاره (fonts.googleapis.com). بلا نت يشتغل بخط مرفوع.",
    "مكتبة الأصوات: أول مرة تستخدم صوتاً ينزل من Mixkit (assets.mixkit.co) وينحفظ على جهازك.",
    "بحث الصور والمقاطع: يسأل ويكيميديا كومنز بكلمات البحث فقط وينزّل اللي تختاره.",
    "لقطة موقع: يفتح الرابط اللي تكتبه أنت فقط.",
    "غير هذا ما فيه أي اتصال: الفيديو والصوت والنص والوجه كلها تتعالج على جهازك.",
]
def tools_text():
    L = ["الأدوات اللي يحتاجها Hojas Studio (كلها مجانية ومفتوحة المصدر، وما يتثبّت شي إلا بموافقتك):", ""]
    for name, why, src, ok in TOOLS:
        try: good = ok()
        except Exception: good = False
        L += ["%s %s" % ("✓" if good else "□", name), "   ليش: " + why, "   وش هو: " + src, ""]
    L += ["وش يتصل بالنت:"] + ["  · " + x for x in NET_USE]
    L += ["", "الخادم محلي على جهازك (127.0.0.1). رابط الجوال يشتغل على شبكة البيت فقط وبرمز دخول، ورابط العميل برمز ثاني بصلاحية تعليق فقط.",
          "فصل الشخص وتحديد الوجه بموديلات محفوظة داخل السكل (engine/vision، من MediaPipe المفتوح): ما ترفع صورتك لأي خدمة."]
    return "\n".join(L)
# ───────────────────────── مكتبة المؤثرات الصوتية (3.6) ─────────────────────────
# 30 صوت من Mixkit. رخصتها تسمح باستخدامها داخل الفيديو، وما تسمح بإعادة توزيع الملفات نفسها،
# فالسكل ما يحملها معه: كل جهاز ينزّلها من المصدر مرة وحدة وتنحفظ في ~/.hojas-studio/sfx
def sfx_lib():
    return rj(os.path.join(HERE, "sfxlib.json"), []) or []
def sfx_dir():
    d = os.path.join(HOME_CFG, "sfx"); os.makedirs(d, exist_ok=True); return d
def sfx_path(i): return os.path.join(sfx_dir(), os.path.basename(str(i)) + ".wav")
def sfx_have(i):
    try: return os.path.getsize(sfx_path(i)) > 2000
    except OSError: return False
def sfx_fetch(ids=None, log=None):
    """ينزّل الناقص. يرجّع (كم نزل، قائمة اللي فشل)."""
    lib = {x["id"]: x for x in sfx_lib()}; ids = [i for i in (ids or list(lib)) if i in lib]; ok = 0; bad = []
    for i in ids:
        if sfx_have(i): continue
        try:
            rq = urllib.request.Request(lib[i]["url"], headers={"User-Agent": "Mozilla/5.0 (Hojas Studio)"})
            b = urllib.request.urlopen(rq, timeout=40).read()
            if len(b) < 2000 or b[:4] != b"RIFF": raise ValueError("الملف مو صوت")
            tmp = sfx_path(i) + ".part"; open(tmp, "wb").write(b); os.replace(tmp, sfx_path(i)); ok += 1
            if log: log("نزل: %s (%s)" % (lib[i]["ar"], i))
        except Exception as e:
            bad.append(i)
            if log: log("فشل: %s (%s) ← %s" % (lib[i]["ar"], i, str(e)[:90]))
    return ok, bad
def cmd_sfx(work, args):
    sub = args[0] if args else "list"; lib = sfx_lib(); mine = my_list(); ids = {x["id"] for x in lib} | {m["id"] for m in mine}
    if sub == "list":
        for x in lib: print("%-7s %-5s %s  %s" % (x["id"], x["dur"], "✓" if sfx_have(x["id"]) else "—", x["ar"]))
        print("\n✓ = منزّل على هذا الجهاز. نزّل الباقي: hs sfx <work> fetch")
        print("\nأصوات المستخدم (ملفاته هو، قدّمها على المكتبة لما تناسب اللحظة):" if mine else "\nما عنده أصوات خاصة بعد. مجلدها: " + my_dir())
        for m in mine: print("%-7s %-6s %s%s%s" % (m["id"], "%ss" % m.get("dur", 0), m["name"], "  ← " + m["note"] if m.get("note") else "", "  (طويل: يصلح خلفية أو موسيقى، حدد المدة [ث, قوة, مدة])" if float(m.get("dur") or 0) > 8 else ""))
        return
    if sub == "import":
        rest = list(args[1:]); nm = nt = None
        for flag_ in ("--name", "--note"):
            if flag_ in rest:
                i = rest.index(flag_); v = rest[i + 1]; del rest[i:i + 2]
                if flag_ == "--name": nm = v
                else: nt = v
        if not rest: sys.exit("sfx import <ملف صوت أو مجلد> [--name \"…\"] [--note \"متى ينستخدم\"]")
        src = os.path.abspath(rest[0]); files = [os.path.join(src, f) for f in sorted(os.listdir(src)) if f.lower().endswith(AUD_EXT)] if os.path.isdir(src) else [src]
        for f in files:
            try: m = my_import(f, nm if len(files) == 1 else None, nt or ""); print("انضاف: %s ← %s (%ss)" % (m["id"], m["name"], m.get("dur")))
            except Exception as e: print("فشل: %s ← %s" % (os.path.basename(f), str(e)[:100]))
        return
    if sub == "fetch":
        ok, bad = sfx_fetch(args[1:] or None, print); print("نزل %d · فشل %d%s" % (ok, len(bad), (" (يحتاج نت)" if bad else ""))); return
    if sub in ("add", "rm"):
        if len(args) < 3: sys.exit("sfx %s <id> <ثانية> [ثانية …]   (الأصوات المبنية: tap · thud · whoosh_up · whoosh_down)" % sub)
        k = args[1]
        if k not in ids and k not in ("tap", "thud", "whoosh_up", "whoosh_down"): sys.exit("ما فيه صوت بهذا الرقم. شوف: hs sfx <work> list")
        if k in {x["id"] for x in lib} and sub == "add" and not sfx_have(k):
            _, bad = sfx_fetch([k], print)
            if bad: sys.exit("ما قدرت أنزّل الصوت (يحتاج نت).")
        sp = J(work, "sfx.json"); s = rj(sp, {"outro": 0}) or {"outro": 0}; ts = [round(float(x), 3) for x in args[2:]]; cur = s.get(k) or []
        if sub == "add": cur = sorted(cur + ts, key=lambda q: q[0] if isinstance(q, list) else q)
        else: cur = [q for q in cur if not any(abs((q[0] if isinstance(q, list) else q) - t) < 0.06 for t in ts)]
        if cur: s[k] = cur
        else: s.pop(k, None)
        wj(sp, s); print("تم: %s ← %s" % (k, cur)); return
    sys.exit("sfx: list | fetch [id …] | add <id> <ث> … | rm <id> <ث> … | import <ملف أو مجلد>")
def build_sfx(work, S, log, gains):
    sfx = rj(J(work, "sfx.json"), {"outro": 0}) or {"outro": 0}
    types = [k for k, v in sfx.items() if isinstance(v, list) and v]
    if not types or all(abs(float(gains.get(k, 1)) - 1) < 0.01 for k in types):
        run([PY, os.path.join(S, "05_sfx.py"), work], log, cwd=work, check=False); return
    tmp = J(work, ".hs", "sfxtmp"); shutil.rmtree(tmp, ignore_errors=True); ins = []; flt = []
    for n, k in enumerate(types):
        d = os.path.join(tmp, k); os.makedirs(d); shutil.copy(J(work, "caps.json"), os.path.join(d, "caps.json"))
        wj(os.path.join(d, "sfx.json"), {"outro": sfx.get("outro", 0), k: sfx[k]})
        run([PY, os.path.join(S, "05_sfx.py"), d], log, check=False)
        if os.path.exists(os.path.join(d, "sfx.wav")): ins += ["-i", os.path.join(d, "sfx.wav")]; flt.append("[%d:a]volume=%.3f[s%d]" % (len(flt), float(gains.get(k, 1)), len(flt)))
    if not flt: return
    fc = ";".join(flt) + ";" + "".join("[s%d]" % i for i in range(len(flt))) + "amix=inputs=%d:duration=longest:normalize=0[o]" % len(flt)
    run(["ffmpeg", "-v", "error"] + ins + ["-filter_complex", fc, "-map", "[o]", "-ac", "2", "-ar", "48000", "-y", J(work, "sfx.wav")], log)
def encode(work, S, log, out_final, out_master, mix):
    caps = rj(J(work, "caps.json")); sfx = rj(J(work, "sfx.json"), {"outro": 0}) or {}
    dur = round(caps["total"] + sfx.get("outro", 0), 3); fade = round(dur - 0.6, 3)
    voice = float(mix.get("voice", 1)); chain = (CLEAN_AF if mix.get("clean") else "") + VOICE_FX.get(mix.get("voiceFx") or "", "") + "volume=%.3f," % voice
    has_sfx = os.path.exists(J(work, "sfx.wav")); ins = ["-framerate", "30", "-i", J(work, "out", "%05d.jpg"), "-i", J(work, "cutz.mp4")] + (["-i", J(work, "sfx.wav")] if has_sfx else [])
    fc = "[0:v]scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p[vo];[1:a]%sapad=pad_dur=8[a0];" % chain
    fc += ("[a0][2:a]amix=inputs=2:duration=first:normalize=0[am];" if has_sfx else "[a0]anull[am];")
    fc += "[am]atrim=0:%s,asetpts=PTS-STARTPTS,afade=t=out:st=%s:d=0.6[ao]" % (dur, fade)
    for f in (out_final, out_master):
        try: os.remove(f)
        except FileNotFoundError: pass
    log("تجميع…")
    run(["ffmpeg", "-v", "error", "-nostats"] + ins + ["-filter_complex", fc, "-map", "[vo]", "-map", "[ao]", "-c:v", "libx264", "-preset", "slow", "-crf", "21",
         "-maxrate", "6M", "-bufsize", "12M", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "-y", out_final], log)
    log("معايرة الصوت…"); env = dict(os.environ); env["BG_GAIN"] = str(mix.get("bg", 0.28))
    r = run(["bash", os.path.join(S, "06b_master.sh"), work, out_final, out_master], log, cwd=work, check=False, env=env)
    if not os.path.exists(out_master): log("المعايرة ما اشتغلت — أسلّم الملف بلا معايرة"); shutil.copy(out_final, out_master)
def export(work, S, log, kind="final", hooks=False, frame=None):
    """kind: final | clean (بلا كابشن). hooks=True يطلّع نسخة لكل صيغة هوك."""
    st = load_studio(work); hs = hs_of(st); mix = hs.get("mix") or {}; outs = []
    if kind == "clean": hs["nocap"] = True; wj(J(work, "studio.json"), st)
    try:
        patch(work, quiet=True); render_frames(work, S, log); os.environ["HS_DUCK"] = str(mix.get("duck", 0.45)); build_sfx(work, S, log, mix.get("sfx") or {})
        name = "ad-clean" if kind == "clean" else "ad"
        fin, mas = (J(work, "ad-clean-raw.mp4"), J(work, "ad-clean.mp4")) if kind == "clean" else (J(work, "ad-final.mp4"), J(work, "ad-master.mp4"))
        encode(work, S, log, fin, mas, mix); outs.append(os.path.basename(mas))
        ar, cy = frame_of(hs); ar = frame if frame in FRAMES else ar
        if kind == "final":
            for old in glob.glob(J(work, "ad-[0-9]*x[0-9]*.mp4")): os.remove(old)
            r = reframe(work, mas, ar, cy, log)
            if r: outs.append(r)
        hk = hs.get("hooks") or {}
        if hooks and kind == "final" and hk.get("on") and len(hk.get("items") or []) > 1:
            act = int(hk.get("active", 0)); d = float(hk.get("dur", 2.6)) + 0.5
            for i in range(len(hk["items"])):
                if i == act: continue
                st2 = load_studio(work); hs_of(st2)["hooks"]["active"] = i; wj(J(work, "studio.json"), st2)
                log("نسخة الهوك %d…" % (i + 1)); render_frames(work, S, log, (0, d))
                encode(work, S, log, J(work, "ad-hook-%d-raw.mp4" % (i + 1)), J(work, "ad-hook-%d.mp4" % (i + 1)), mix); outs.append("ad-hook-%d.mp4" % (i + 1))
                try: os.remove(J(work, "ad-hook-%d-raw.mp4" % (i + 1)))
                except OSError: pass
            st2 = load_studio(work); hs_of(st2)["hooks"]["active"] = act; wj(J(work, "studio.json"), st2); render_frames(work, S, log, (0, d))
    finally:
        if kind == "clean":
            st3 = load_studio(work); hs_of(st3).pop("nocap", None); wj(J(work, "studio.json"), st3)
            try: os.remove(J(work, "ad-clean-raw.mp4"))
            except OSError: pass
    if kind == "final":
        ed = J(work, ".hs", "exports"); os.makedirs(ed, exist_ok=True); shutil.copy(J(work, "ad-master.mp4"), os.path.join(ed, time.strftime("%Y%m%d-%H%M%S") + ".mp4"))
        for old in sorted(os.listdir(ed))[:-6]: os.remove(os.path.join(ed, old))
    return outs

def srt_ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = int(t % 60); ms = int(round((t - int(t)) * 1000))
    if ms == 1000: s += 1; ms = 0
    return "%02d:%02d:%02d,%03d" % (h, m, s, ms)
def make_srt(work, lang):
    caps = rj(J(work, "caps.json")); cs = caps["cards"]; mp = ((load_studio(work).get("hs") or {}).get("en") or {}).get("map") or {}; out = []; n = 0
    for i, c in enumerate(cs):
        txt = card_key(c) if lang == "ar" else mp.get(card_key(c), "")
        if not txt: continue
        end = min(c["e"], cs[i + 1]["s"] - 0.02) if i + 1 < len(cs) else c["e"]
        if end <= c["s"]: end = c["s"] + 0.4
        n += 1; out.append("%d\n%s --> %s\n%s\n" % (n, srt_ts(c["s"]), srt_ts(end), txt))
    return "\n".join(out), n
def pack(work):
    """حزمة النشر: الفيديو النهائي + SRT عربي/إنجليزي + نص الكلام + نص البوست، في ملف zip واحد."""
    files = []; pk = J(work, "publish"); os.makedirs(pk, exist_ok=True)
    for f in ("ad-master.mp4", "ad-clean.mp4") + tuple(sorted(x for x in os.listdir(work) if re.match(r"ad-(hook-\d+|\d+x\d+)\.mp4$", x))):
        if os.path.exists(J(work, f)): files.append(J(work, f))
    for lang in ("ar", "en"):
        s, n = make_srt(work, lang)
        if n: p = os.path.join(pk, "captions.%s.srt" % lang); open(p, "w", encoding="utf-8").write(s); files.append(p)
    caps = rj(J(work, "caps.json")); p = os.path.join(pk, "transcript.txt"); open(p, "w", encoding="utf-8").write("\n".join(card_key(c) for c in caps["cards"]) + "\n"); files.append(p)
    if os.path.exists(J(work, "post.txt")): files.append(J(work, "post.txt"))
    cr = rj(J(work, "assets", "credits.json"), []) or []; used = set(l.get("src", "").split("/")[-1] for l in (load_studio(work).get("hs") or {}).get("layers") or [])
    cr = [c for c in cr if c["file"] in used]
    if cr:
        p = os.path.join(pk, "credits.txt"); open(p, "w", encoding="utf-8").write("\n".join("%s — %s — %s — %s" % (c.get("title"), c.get("author") or "?", c.get("license"), c.get("source")) for c in cr) + "\n"); files.append(p)
    z = J(work, ".hs", "pack.zip"); os.makedirs(J(work, ".hs"), exist_ok=True)
    with zipfile.ZipFile(z, "w", zipfile.ZIP_STORED) as zf:
        for f in files: zf.write(f, os.path.basename(f))
    return [os.path.basename(f) for f in files]

# ───────────────────────── الأسئلة قبل المونتاج (brief) ─────────────────────────
def brief_paths(work): return J(work, ".hs", "brief_ask.json"), J(work, "brief.json")
def brief_state(work):
    ap, bp = brief_paths(work); ask = rj(ap); ans = rj(bp)
    if not ask: return None
    return "saved" if (ans and ans.get("savedAt", 0) >= ask.get("askedAt", 0)) else "pending"
def brief_ask(work, hooks=(), topics=(), note="", extra=None):
    ap, bp = brief_paths(work); os.makedirs(J(work, ".hs"), exist_ok=True)
    if os.path.exists(bp): shutil.copy(bp, J(work, ".hs", "brief.prev.json"))
    wj(ap, {"askedAt": int(time.time()), "hooks": list(hooks), "topics": list(topics), "note": note, "extra": extra or []})
    say(work, "جهّزت لك أسئلة قبل ما أبدأ المونتاج. جاوب عليها واضغط حفظ.", "ask")
def brief_text(work):
    a = rj(brief_paths(work)[1]) or {}; caps = rj(J(work, "caps.json"), {"cards": []}); L = []
    def row(k, v):
        if v not in (None, "", [], {}): L.append("- %s: %s" % (k, v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)))
    row("نوع المقطع", a.get("goalText") if a.get("goal") == "other" else a.get("goal")); row("المنصات", a.get("platform")); row("المقاس", a.get("frame")); row("ألوان الحساب", a.get("theme")); row("المدة", a.get("length")); row("الإيقاع", a.get("pace"))
    row("الكابشن", a.get("cap")); row("ترجمة إنجليزية", "نعم" if a.get("en") else "لا"); row("الهوك", a.get("hook"))
    row("الشخصية", a.get("char")); row("الصور والمقاطع", a.get("media")); row("كروت الشرح", a.get("cards")); row("المؤثرات", a.get("fx"))
    c = a.get("cut") or {}; drop = [i for i in (c.get("drop") or []) if i < len(caps["cards"])]
    row("القص", {"fillers": c.get("fillers"), "dupes": c.get("dupes")})
    for i in drop: L.append("  · يبي تنشال الجملة %d: %s" % (i + 1, card_key(caps["cards"][i])))
    row("الهوية", a.get("brand")); row("الختام", a.get("outro")); row("إجابات إضافية", a.get("extra")); row("رابط مرجعي", a.get("ref")); row("ملاحظاته", a.get("notes"))
    return "\n".join(L) or "ما فيه إجابات."
def brief_apply(work):
    """يطبّق الإجابات اللي لها إعداد مباشر، ويطبع الباقي كمهام لـ Claude."""
    a = rj(brief_paths(work)[1]) or sys.exit("ما فيه إجابات محفوظة بعد."); sp = J(work, "studio.json"); st = load_studio(work); hs = hs_of(st); todo = []; done = []
    if a.get("brand"):
        b = rj(os.path.join(brand_dir(), a["brand"] + ".json"))
        if b: hs["cap"] = {**(hs.get("cap") or {}), **(b.get("cap") or {})}; hs["en"] = {**(hs.get("en") or {}), **(b.get("en") or {})}; done.append("الهوية: " + a["brand"])
    if a.get("cap"): hs["cap"] = {**{k: v for k, v in (hs.get("cap") or {}).items() if k not in CAP_STYLE_KEYS}, **a["cap"], "on": True}; done.append("إعدادات الكابشن")
    plats = [x for x in (a.get("platform") or []) if x in PLATFORMS]; ar = a.get("frame") if a.get("frame") in FRAMES else "9:16"
    hs["frame"] = {**(hs.get("frame") or {}), "ar": ar}; hs["platforms"] = plats; done.append("المقاس " + ar)
    sz = safe_of(plats, ar, frame_of(hs)[1]); cy_ = float((hs.get("cap") or {}).get("y", 76))
    if a.get("cap") and not (sz["capMin"] <= cy_ <= sz["capMax"]):
        ny = min(sz["capMax"], max(sz["capMin"], cy_)); hs["cap"]["y"] = ny; done.append("رفعت/نزّلت الكابشن إلى %s%% عشان يطلع داخل المنطقة الآمنة لمنصاته" % ny)
    th_a = a.get("theme") or {}; tp0 = J(work, "theme.json"); th0 = rj(tp0, {}) or {}
    def _dark(hx, k=0.72):
        try: r, g, b = (int(hx[i:i + 2], 16) for i in (1, 3, 5)); return "#%02X%02X%02X" % (int(r * k), int(g * k), int(b * k))
        except Exception: return hx
    if th_a.get("mode") == "mono": th0.update({"bg": "#0E0E10", "ink": "#FFFFFF", "acc": "#FFE14D", "clay": "#C9A800", "mut": "#9A9AA5"}); done.append("الألوان: أبيض وأسود")
    elif th_a.get("mode") == "custom": th0.update({"bg": th_a.get("bg") or "#101014", "ink": th_a.get("ink") or "#FFFFFF", "acc": th_a.get("acc") or "#F2B33D", "clay": _dark(th_a.get("acc") or "#F2B33D"), "mut": "#9A9AA5"}); done.append("الألوان: ألوانه (%s · %s)" % (th0["bg"], th0["acc"]))
    else: todo.append("الألوان: قال «اختر لي من المقطع». اقرأ لقطة من الفيديو واختر خلفية غامقة قريبة من لون ملابسه أو خلفيته ولون تمييز يبان عليها، واكتبها في theme.json (bg · ink · acc · clay · mut) بدون ما تسأله")
    if th_a.get("handle"): th0["handle"] = th_a["handle"]
    if (a.get("cap") or {}).get("font"): th0["font"] = a["cap"]["font"]
    th0.setdefault("grade", False); th0.setdefault("badgeUntil", 0); wj(tp0, th0)
    todo.append('حركات الأرقام: أي نسبة أو مقارنة أو مسافة بكلامه لها حركة جاهزة (layer add type=viz kind=pctdots|people|fill|bars|route …). شوف جدول «الحركات» في SKILL.md. موقع يذكره؟ hs shot <work> <الرابط> --at <ث>. موضوع تاريخي أو مكان؟ hs media <work> search "…" --video')
    cd = a.get("cards") or "some"; tot_ = float((rj(J(work, "caps.json"), {}) or {}).get("total") or 30)
    if cd == "none": todo.append("كروت الشرح: ما يبيها. لا تضف أي كرت شاشة مقسومة")
    else:
        per = {"few": 22, "some": 12, "many": 7}.get(cd, 12); n_ = max(1, int(round(tot_ / per)))
        todo.append("كروت الشرح (%s): حط تقريباً %d كرت بهذا المقطع، ونوّع أشكالها ولا تكرر نفس الشكل مرتين ورا بعض. لكل فكرة اختر الشكل اللي يشرحها: خطوات ← style=steps · مراحل تتحول ← flow · مقارنة ← versus · رقم ← stat · صح وغلط ← check · تواريخ ← timeline · تناقص ← funnel · جملة قوية ← quote · علاقة أو فكرة مركّبة ← style=draw ترسمها أنت بعناصر (دوائر، صناديق، أسهم، أيقونات، أرقام تعد). الأمر: python hs.py layer <work> add type=split style=<الشكل> title=\"…\" \"text=سطر\\nسطر\" s=<بداية الجملة> e=<نهايتها>. التفاصيل والأمثلة في SKILL.md قسم «كروت الشرح». لا تحطها على الهوك، ومدة الكرت = مدة الكلام عنه" % ({"few": "قليل", "some": "متوسط", "many": "كثير"}.get(cd, cd), n_))
    hs.setdefault("en", {})["on"] = bool(a.get("en"))
    if a.get("en"): todo.append("اكتب الترجمة الإنجليزية: tr export ثم tr import")
    hk = a.get("hook") or {}
    if hk.get("use"):
        items = [{"text": x} for x in ([hk.get("text")] if hk.get("text") else []) + [v for v in (hk.get("variants") or []) if v and v != hk.get("text")]][:3]
        if items: hs["hooks"] = {**{"dur": 2.6, "style": "box"}, **(hs.get("hooks") or {}), "on": True, "active": 0, "items": items}; done.append("الهوك (%d صيغة)" % len(items))
        else: todo.append("اكتب 3 صيغ هوك من أقوى سطر: hook set")
    elif "hooks" in hs: hs["hooks"]["on"] = False
    ch = a.get("char") or {}; Ls = [l for l in hs.get("layers") or [] if l.get("auto") != "char"]
    if ch.get("use") and ch["use"] != "none":
        total = (rj(J(work, "caps.json"), {}) or {}).get("total", 30); right = ch.get("side") == "right"
        L = {"id": new_id(Ls), "type": "char", "auto": "char", "s": 0, "e": total, "track": 0, "x": 0.8 if right else 0.2, "y": 0.62, "size": 0.26, "anim": "pop", "react": True, "flip": right}
        if ch.get("src"): L["src"] = ch["src"]
        else: L["char"] = ch["use"]; L["color"] = ch.get("color") or "#8F73F5"
        Ls.append(L); done.append("الشخصية: " + str(ch.get("src") or ch["use"]))
    hs["layers"] = Ls
    fx = a.get("fx") or {}; mix = hs.setdefault("mix", {})
    if fx.get("sfx") == "none": todo.append("بلا مؤثرات صوتية: فرّغ sfx.json (خلّ outro فقط)")
    elif fx.get("sfx") == "light": todo.append("مؤثرات صوتية خفيفة: 6 أحداث بالدقيقة بالكثير، من مكتبة الأصوات (hs sfx <work> list ثم hs sfx <work> add <id> <ثانية>)")
    elif fx.get("sfx") == "rich": todo.append("مؤثرات صوتية أكثر: لين 15 حدث بالدقيقة عند اللحظات اللي لها معنى، من مكتبة الأصوات (hs sfx <work> list ثم hs sfx <work> add <id> <ثانية>)")
    wj(sp, st)
    if a.get("pace"):
        tp = J(work, "theme.json"); th = rj(tp, {}) or {}
        if a["pace"] == "calm": th["pace"] = "calm"
        else: th.pop("pace", None)
        wj(tp, th); todo.append({"calm": "إيقاع هادي: مشاهد أقل وزوم أخف", "normal": "إيقاع عادي: تغيير بصري كل 2-3 ثواني", "fast": "إيقاع سريع: تغيير بصري كل 1.5-2 ثانية"}.get(a["pace"], ""))
    if fx.get("zoom"): todo.append("بعد ما يجهز الفيديو: python hs.py auto <work> zooms")
    if fx.get("transitions"): todo.append("بعد ما يجهز الفيديو: python hs.py auto <work> transitions")
    if fx.get("bg"): todo.append("يبي صوت بالخلفية: اطلب منه ملف bg-audio.mp3 أو اسأله من وين")
    c = a.get("cut") or {}; cmd = []
    if c.get("drop"): cmd += ["--cards"] + [str(i + 1) for i in c["drop"]]
    if c.get("fillers"): cmd += ["--fillers"]
    if cmd: todo.append("القص المطلوب (نفّذه قبل تصميم المشاهد وبعد ما يجهز cutz.mp4): python hs.py remove <work> " + " ".join(cmd))
    if c.get("dupes"): todo.append("شيل الجمل المعادة: python hs.py check <work> ثم remove --cards للأولى من كل زوج")
    ln = a.get("length")
    if ln and ln != "keep": todo.append({"tight": "شدّ المقطع: شيل أي جملة ما تخدم الفكرة", "max30": "المدة 30 ثانية بالكثير: اختر أقوى الجمل واعرضها عليه قبل القص", "max60": "المدة 60 ثانية بالكثير"}.get(ln, ln))
    m = a.get("media") or {}
    if m.get("mode") and m["mode"] != "none":
        t = "، ".join(m.get("topics") or []) or "استخرجها من الكلام"; n = {"few": "2-3", "some": "4-6", "many": "7-10"}.get(m.get("amount"), "4-6")
        if m["mode"] in ("search", "mix"): todo.append("صور حقيقية (%s صور) عن: %s ← python hs.py media <work> search \"…\" ثم media add <رقم> --at <وقت الجملة>" % (n, t))
        if m["mode"] in ("ai", "mix"): todo.append("صور مولّدة (%s) عن: %s ← لكل وحدة: python hs.py gen <work> request image \"وصف بالإنجليزي\" --at <وقت>%s. التوليد من حسابه الشخصي بلا مفاتيح API: افتح ChatGPT (صور) أو Gemini (مقاطع) بمتصفحه، ولّد ونزّل، ثم gen import <رقم> <ملف>. لو ما عندك متصفحه استخدم موصل التوليد المربوط بحسابه، وإلا خلّ الطلبات تنتظره بالاستوديو وقل له" % (n, t, " · ومقاطع: gen request video" if m.get("video") else ""))
        if m["mode"] == "mine": todo.append("هو بيرفع صوره ومقاطعه من «الملفات»: لا تضف صوراً من عندك")
    o = a.get("outro") or {}
    if o.get("use"): todo.append("كرت الختام: %s%s (studio.json ← outro)" % (o.get("text") or "اكتب دعوة مناسبة", (" · الحساب " + o["handle"]) if o.get("handle") else ""))
    goal = (a.get("goalText") or "").strip() if a.get("goal") == "other" else a.get("goal")
    if goal: todo.append("نوع المقطع: " + str(goal) + ((" (كتبه بنفسه: افهم منه الأسلوب المطلوب وامش عليه)") if a.get("goal") == "other" else ""))
    if ar != "9:16":
        todo.append({"4:5": "المقاس 4:5: التصدير يقص الكادر العمودي إلى 1080×1350. خل الوجه والنصوص والصور داخل الحزام بين %s%% و%s%% من الارتفاع (زر «مناطق الأمان» يوريه)" % tuple(sz["crop"] or (0, 100)),
                     "1:1": "المقاس مربع: التصدير يقص إلى 1080×1080. كل شي مهم داخل الحزام بين %s%% و%s%% من الارتفاع، والمشاهد اللي تملأ الشاشة طولياً بتنقص" % tuple(sz["crop"] or (0, 100)),
                     "16:9": "المقاس عرضي 16:9: المحرّك يركّب عمودي، فالتصدير يحط المقطع بالنص وخلفية مغبّشة منه. قل له هذا بوضوح، ولو يبي عرضي حقيقي يملأ الشاشة يحتاج مونتاج عرضي من المصدر"}[ar])
    for k, v in (a.get("extra") or {}).items(): todo.append("إجابة «%s»: %s" % (k, v))
    if a.get("ref"): todo.append("مرجع يبي مثله: " + a["ref"])
    if a.get("notes"): todo.append("ملاحظاته الحرّة: " + a["notes"])
    print("انطبق تلقائياً: " + ("، ".join(done) or "لا شي")); print("\nمهامك من إجاباته:")
    for x in todo:
        if x: print("  □ " + x)
    if plats:
        print("\nوش تحتاج منصاته (التزم فيها بالمونتاج، ولو تعارضت منصتين امش على الأشد):"); print(platform_text(plats))
        if len(plats) > 1: print("  ← الكابشن والنصوص لازم تكون بين %s%% و%s%% من الارتفاع عشان تسلم في كل المنصات المختارة." % (sz["capMin"], sz["capMax"]))
        short = [n for n in plats if n == "x"]; tot = (rj(J(work, "caps.json"), {}) or {}).get("total", 0)
        if short and tot > 140: print("  ← تنبيه: المقطع %d ثانية وإكس يقبل 140 للحساب العادي. اسأله: حسابه مشترك؟ وإلا اقترح نسخة أقصر." % tot)
    say(work, "قرأت إجاباتك وبدأت المونتاج عليها.", "step")

# ───────────────────────── صور حقيقية برخص حرّة (ويكيميديا كومنز) ─────────────────────────
CAP_STYLE_KEYS = ("bg", "bgColor", "bgOpacity", "stroke", "strokeColor", "shadow", "shadowColor", "hl", "chunk", "actScale", "fill", "mode", "enter", "lines")
MEDIA_UA = {"User-Agent": "hojas-studio/%s (image search for video b-roll)" % VERSION}
LIC_OK = ("Public domain", "CC0", "CC BY 2.0", "CC BY 2.5", "CC BY 3.0", "CC BY 4.0", "CC BY-SA", "PDM", "No restrictions")
def http_json(url, data=None, headers=None, timeout=60, method=None):
    req = urllib.request.Request(url, data=(json.dumps(data).encode() if data is not None else None), headers={**({"Content-Type": "application/json"} if data is not None else {}), **(headers or {})}, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read().decode("utf-8", "replace"))
def video_search(work, q, n=10):
    """مقاطع حقيقية برخص حرّة من ويكيميديا كومنز (أرشيف تاريخي، أخبار، أماكن، علوم). بلا مفتاح."""
    base = os.environ.get("HS_COMMONS_API", "https://commons.wikimedia.org/w/api.php")
    p = {"action": "query", "format": "json", "generator": "search", "gsrsearch": q + " filetype:video", "gsrnamespace": 6, "gsrlimit": max(n * 3, 20), "prop": "videoinfo", "viprop": "url|size|mime|extmetadata|derivatives", "viurlwidth": 480}
    d = http_json(base + "?" + urllib.parse.urlencode(p), headers=MEDIA_UA); res = []
    if not any(pg.get("videoinfo") for pg in (d.get("query", {}).get("pages") or {}).values()):      # خادم ما يدعم videoinfo ← نفس البيانات من imageinfo
        p2 = {**{k: x for k, x in p.items() if not k.startswith("vi")}, "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 480}
        d = http_json(base + "?" + urllib.parse.urlencode(p2), headers=MEDIA_UA)
    for pg in sorted((d.get("query", {}).get("pages") or {}).values(), key=lambda x: x.get("index", 0)):
        vi = (pg.get("videoinfo") or pg.get("imageinfo") or [{}])[0]; em = vi.get("extmetadata") or {}; lic = (em.get("LicenseShortName") or {}).get("value", ""); dur = float(vi.get("duration") or 0)
        if not str(vi.get("mime", "")).startswith("video/") or dur < 2 or vi.get("width", 0) < 320: continue
        if not any(lic.startswith(k) for k in LIC_OK): continue
        ders = [x for x in (vi.get("derivatives") or []) if str(x.get("type", "")).startswith("video/") and x.get("src") and x.get("height")]
        good = sorted([x for x in ders if 360 <= int(x["height"]) <= 1080], key=lambda x: abs(int(x["height"]) - 720))
        url = (good[0]["src"] if good else vi.get("url"))
        res.append({"kind": "video", "title": re.sub(r"^File:|\.\w+$", "", pg.get("title", "")), "thumb": vi.get("thumburl") or "", "url": url, "page": vi.get("descriptionurl", ""), "w": vi.get("width"), "h": vi.get("height"), "dur": round(dur, 1),
                    "lic": lic, "author": re.sub(r"<[^>]+>", "", (em.get("Artist") or {}).get("value", ""))[:80]})
        if len(res) >= n: break
    wj(J(work, ".hs", "media_last.json"), {"q": q, "items": res}); return res
def video_add(work, item, at=None, dur=4.0, start=None, fit=None, log=None):
    """ينزّل المقطع، يقص منه المدة المطلوبة، ويحوّله لقطة بي-رول عمودية على التايم لاين."""
    log = log or (lambda *_: None); os.makedirs(J(work, "broll_src"), exist_ok=True); os.makedirs(J(work, "broll"), exist_ok=True)
    key = "v" + time.strftime("%H%M%S") + secrets.token_hex(2); ext = os.path.splitext(urllib.parse.urlparse(item["url"]).path)[1].lower() or ".webm"; src = J(work, "broll_src", key + ext)
    with urllib.request.urlopen(urllib.request.Request(item["url"], headers=MEDIA_UA), timeout=180) as r, open(src, "wb") as f: shutil.copyfileobj(r, f)
    if os.path.getsize(src) < 20000: raise RuntimeError("المقطع ما نزل")
    total = float(item.get("dur") or 0); dur = max(1.0, min(float(dur or 4), 8.0)); st = float(start) if start not in (None, "") else (max(0.0, min(total * 0.25, total - dur)) if total else 0.0)
    wide = (item.get("w") or 16) > (item.get("h") or 9) * 1.05; mode = fit or ("fit" if wide else "crop")
    vf = ("fps=30,split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:4,eq=brightness=-0.18[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" if mode == "fit"
          else "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")
    run(["ffmpeg", "-v", "error", "-ss", "%.2f" % st, "-t", "%.2f" % dur, "-i", src] + (["-filter_complex", vf] if mode == "fit" else ["-vf", vf]) + ["-q:v", "3", "-y", J(work, "broll", key + "_%04d.jpg")], log)
    n = len([f for f in os.listdir(J(work, "broll")) if f.startswith(key + "_")])
    if not n: raise RuntimeError("ما قدرت أقرأ المقطع")
    stu = load_studio(work); stu.setdefault("brNeed", {})[key] = [1, n]; wj(J(work, "studio.json"), stu); add_broll_clip(work, key, at, n / 30.0)
    cp = J(work, "assets", "credits.json"); os.makedirs(J(work, "assets"), exist_ok=True); cr = rj(cp, []) or []; cr.append({"file": "broll_src/" + key + ext, "title": item.get("title"), "author": item.get("author"), "license": item.get("lic"), "source": item.get("page")}); wj(cp, cr)
    return key, n
def shot_add(work, url, at=None, dur=4.0, full=True, w=0.84, log=None):
    """لقطة لصفحة موقع ← صورة بإطار متصفح على التايم لاين (تتحرك لتحت لو الصفحة طويلة)."""
    log = log or print; eng = find_engine(None) or sys.exit("ما لقيت مجلد engine"); os.makedirs(J(work, "assets"), exist_ok=True)
    if not re.match(r"^https?://", url): url = "https://" + url
    name = "shot-%s.png" % time.strftime("%H%M%S"); out = J(work, "assets", name)
    run(["node", os.path.join(eng, "scripts", "20_shot.js"), url, out] + (["--full"] if full else []), log)
    if not os.path.exists(out): raise RuntimeError("اللقطة ما انحفظت")
    lid = add_image_layer(work, "assets/" + name, at, dur, "free", {"frame": "browser", "url": urllib.parse.urlparse(url).netloc + urllib.parse.urlparse(url).path.rstrip("/"), "w": w, "y": 0.36, "ratio": 1.25, "anim": "rise"})
    return lid, name
def media_search(work, q, n=12):
    base = os.environ.get("HS_COMMONS_API", "https://commons.wikimedia.org/w/api.php")
    p = {"action": "query", "format": "json", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": max(n * 3, 20), "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 1600}
    d = http_json(base + "?" + urllib.parse.urlencode(p), headers=MEDIA_UA); res = []
    pages = sorted((d.get("query", {}).get("pages") or {}).values(), key=lambda x: x.get("index", 0))
    for pg in pages:
        ii = (pg.get("imageinfo") or [{}])[0]; mime = ii.get("mime", ""); em = ii.get("extmetadata") or {}; lic = (em.get("LicenseShortName") or {}).get("value", "")
        if not mime.startswith("image/") or mime in ("image/svg+xml", "image/gif") or ii.get("width", 0) < 700: continue
        if not any(lic.startswith(k) for k in LIC_OK): continue
        res.append({"title": re.sub(r"^File:|\.\w+$", "", pg.get("title", "")), "thumb": ii.get("thumburl") or ii.get("url"), "url": ii.get("thumburl") or ii.get("url"), "page": ii.get("descriptionurl", ""),
                    "w": ii.get("width"), "h": ii.get("height"), "lic": lic, "author": re.sub(r"<[^>]+>", "", (em.get("Artist") or {}).get("value", ""))[:80]})
        if len(res) >= n: break
    wj(J(work, ".hs", "media_last.json"), {"q": q, "items": res}); return res
def add_image_layer(work, src, at=None, dur=3.0, fit="card", extra=None):
    st = load_studio(work); hs = hs_of(st); Ls = hs.setdefault("layers", []); total = (rj(J(work, "caps.json"), {}) or {}).get("total", 0) or 600
    s = max(0.0, min(float(at or 0), max(0, total - 0.5))); L = {"id": new_id(Ls), "type": "image", "src": src, "s": round(s, 3), "e": round(min(total, s + float(dur)), 3), "track": 0, "fit": fit, "kb": True, "anim": "fade", **(extra or {})}
    Ls.append(L); wj(J(work, "studio.json"), st); return L["id"]
def media_add(work, item, at=None, dur=3.0, fit="card"):
    os.makedirs(J(work, "assets"), exist_ok=True); slug = re.sub(r"[^\w\-]+", "-", item.get("title", "image"))[:40].strip("-") or "image"
    name = slug + ".jpg"; n = 1
    while os.path.exists(J(work, "assets", name)): n += 1; name = "%s-%d.jpg" % (slug, n)
    raw = urllib.request.urlopen(urllib.request.Request(item["url"], headers=MEDIA_UA), timeout=120).read()
    if len(raw) < 2000: raise RuntimeError("الصورة ما نزلت")
    open(J(work, "assets", name), "wb").write(raw)
    cp = J(work, "assets", "credits.json"); cr = rj(cp, []) or []; cr.append({"file": name, "title": item.get("title"), "author": item.get("author"), "license": item.get("lic"), "source": item.get("page")}); wj(cp, cr)
    return add_image_layer(work, "assets/" + name, at, dur, fit), name

# ───────────────────────── توليد بالذكاء الاصطناعي من حساب المستخدم (بلا مفاتيح API) ─────────────────────────
# الطلب ينحفظ في gen.json. يتنفّذ بأحد ثلاث طرق، كلها بحسابه الشخصي: (1) Claude يفتح ChatGPT/Gemini في متصفحه وينزّل الناتج
# (2) موصل التوليد المربوط بحسابه في Claude  (3) هو نفسه يضغط «افتح» بالاستوديو ويرفع الملف. ثم gen_import يدخّله التايم لاين.
GEN_SITES = {"image": "https://chatgpt.com/", "video": "https://gemini.google.com/app"}
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp"); VID_EXT = (".mp4", ".mov", ".webm", ".m4v")
def gen_list(work): return rj(J(work, "gen.json"), []) or []
def gen_request(work, kind, prompt, at=None, fit="card", by="user"):
    if kind not in ("image", "video"): raise RuntimeError("النوع: image أو video")
    q = gen_list(work); rid = max([int(x["id"]) for x in q] or [0]) + 1
    q.append({"id": rid, "kind": kind, "prompt": prompt.strip(), "at": (round(float(at), 2) if at is not None else None), "fit": fit or "card", "status": "pending", "by": by, "ts": int(time.time())})
    wj(J(work, "gen.json"), q); return rid
def gen_prompt(r, frame="9:16"):
    """النص اللي ينلصق في ChatGPT أو Gemini."""
    if r["kind"] == "image": return "Create an image: %s. Vertical 9:16 portrait, high detail, no text or watermark in the image." % r["prompt"]
    return "Generate a video: %s. Vertical 9:16, about 8 seconds, no text or captions in the video." % r["prompt"]
def gen_import(work, rid, src, name=None, at=None, fit=None, log=print):
    q = gen_list(work); r = next((x for x in q if str(x["id"]) == str(rid)), None) if rid not in (None, "", "-", "new") else None
    name = name or os.path.basename(src); ext = os.path.splitext(name)[1].lower(); at = at if at is not None else (r or {}).get("at"); fit = fit or (r or {}).get("fit") or "card"
    if not os.path.isfile(src) or os.path.getsize(src) < 1500: raise RuntimeError("ما لقيت الملف أو إنه فاضي: " + src)
    tag = "gen%s-%s" % (r["id"] if r else "", time.strftime("%H%M%S"))
    if ext in IMG_EXT:
        os.makedirs(J(work, "assets"), exist_ok=True); fn = tag + ext; shutil.copy(src, J(work, "assets", fn))
        lid = add_image_layer(work, "assets/" + fn, at, 3, fit); res = {"file": "assets/" + fn, "layer": lid}
    elif ext in VID_EXT:
        os.makedirs(J(work, "broll_src"), exist_ok=True); os.makedirs(J(work, "broll"), exist_ok=True); key = tag.replace("-", ""); dst = J(work, "broll_src", key + ext); shutil.copy(src, dst)
        run(["ffmpeg", "-v", "error", "-i", dst, "-vf", "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920", "-q:v", "3", "-y", J(work, "broll", key + "_%04d.jpg")], log)
        n = len([f for f in os.listdir(J(work, "broll")) if f.startswith(key + "_")])
        if not n: raise RuntimeError("ما قدرت أقرأ المقطع")
        st = load_studio(work); st.setdefault("brNeed", {})[key] = [1, n]; wj(J(work, "studio.json"), st); add_broll_clip(work, key, at); res = {"file": "broll_src/" + key + ext, "clip": key, "frames": n}
    else: raise RuntimeError("صيغة غير مدعومة: صور png/jpg/webp أو مقاطع mp4/mov/webm")
    if r:
        q = gen_list(work)
        for x in q:
            if x["id"] == r["id"]: x.update(status="done", file=res["file"], doneAt=int(time.time()))
        wj(J(work, "gen.json"), q)
    return res
def gen_rm(work, rid): q = [x for x in gen_list(work) if str(x["id"]) != str(rid)]; wj(J(work, "gen.json"), q); return q
def add_broll_clip(work, key, at=None, dur=None):
    st = load_studio(work); n = (st.get("brNeed") or {}).get(key, [1, 90])[1]; total = (rj(J(work, "caps.json"), {}) or {}).get("total", 0) or 600
    s = max(0.0, min(float(at or 0), max(0, total - 0.5))); st.setdefault("brollClips", []).append({"k": key, "s": round(s, 3), "e": round(min(total, s + (float(dur) if dur else min(4, n / 30))), 3), "mode": "full"}); wj(J(work, "studio.json"), st)

# ───────────────────────── إضافات تلقائية: تقريب عند الكلمات المميّزة · انتقال عند القصات ─────────────────────────
def auto_layers(work, kind, on=True, opts=None):
    opts = opts or {}
    st = load_studio(work); hs = hs_of(st); Ls = [l for l in hs.get("layers") or [] if l.get("auto") != kind]; caps = rj(J(work, "caps.json"), {"cards": [], "total": 0}); total = caps.get("total", 0); n = 0
    if on and kind == "zooms":
        last = -9
        for c in caps["cards"]:
            for w in c["w"]:
                if w.get("hot") and w["s"] - last > 2.5 and w["s"] > 0.8 and not any(l.get("auto") == "zooms" and c["s"] <= l["s"] <= c["e"] for l in Ls):
                    Ls.append({"id": new_id(Ls), "type": "fx", "fx": "punch", "auto": "zooms", "s": round(max(0, w["s"] - 0.05), 3), "e": round(min(total, w["e"] + 0.55), 3), "amount": 0.5, "track": 2}); last = w["s"]; n += 1
    if on and kind == "transitions":
        typ = opts.get("type") or (hs.get("look") and (looks_all().get(hs["look"].get("name")) or {}).get("tr")) or "curve"; dr = opts.get("dir") or hs.get("trDir") or "right"
        cards = caps["cards"]; bounds = [c["s"] for i, c in enumerate(cards) if i == 0 or re.search(r"[.!?؟…]$", str(cards[i - 1]["w"][-1]["t"]).strip()) or c["s"] - cards[i - 1]["e"] > 0.45]
        seams = [sm for sm in keep_seams(work) if 0.6 < sm < total - 0.6]; pick = [sm for sm in seams if any(abs(sm - b) < 0.4 for b in bounds)] or seams[::3]; last = -9
        for sm in pick:   # الانتقال عند تغيّر الفكرة فقط، مو عند كل قصة. والقصات الباقية قطع مباشر
            if sm - last < 4: continue
            Ls.append({"id": new_id(Ls), "type": "fx", "fx": typ, "dir": dr, "auto": "transitions", "seam": round(sm, 3), "s": round(sm - 0.3, 3), "e": round(min(total, sm + 0.35), 3), "amount": 0.6, "track": 2}); n += 1; last = sm
    if on and kind == "beats":
        b = rj(J(work, "beats.json")) or sys.exit("شغّل أول: hs beat <work> <ملف الموسيقى>")
        if not b.get("rhythmic"): print("الموسيقى هادية: ما حطيت ضربات. امش على الجمل.")
        else:
            last = -9
            for t0 in b.get("strong") or []:
                if 0.3 < t0 < total - 0.3 and t0 - last >= 1.2: Ls.append({"id": new_id(Ls), "type": "fx", "fx": "punch", "auto": "beats", "s": round(t0 - 0.02, 3), "e": round(t0 + 0.28, 3), "amount": 0.45, "track": 2}); n += 1; last = t0
    hs["layers"] = Ls; wj(J(work, "studio.json"), st); return n

def cmd_brief(work, args):
    sub = args[0] if args else "show"
    def multi(name):
        if name not in args: return []
        i = args.index(name); j = i + 1
        while j < len(args) and not args[j].startswith("--"): j += 1
        return args[i + 1:j]
    if sub == "ask":
        extra = rj(multi("--file")[0]) if multi("--file") else None
        brief_ask(work, hooks=multi("--hooks"), topics=multi("--topics"), note=" ".join(multi("--note")), extra=extra)
        u = J(work, ".hs", "url.txt"); print("الأسئلة جاهزة للمستخدم." + ((" الرابط: " + open(u).read().split("\n")[0]) if os.path.exists(u) else " شغّل: hs.py open <work>"))
        print("انتظره: python hs.py brief <work> wait")
    elif sub == "wait":
        tmo = float((multi("--timeout") or ["540"])[0]); t0 = time.time()
        if brief_state(work) is None: sys.exit("ما فيه أسئلة مرسلة. ابدأ بـ: brief <work> ask")
        while brief_state(work) != "saved":
            if time.time() - t0 > tmo: print("لسه ما حفظ إجاباته. أعد تشغيل نفس الأمر وانتظره، ولا تبدأ المونتاج قبلها."); sys.exit(3)
            time.sleep(2)
        print("حفظ إجاباته:\n" + brief_text(work)); print("\nالخطوة الجاية: python hs.py brief <work> apply")
    elif sub == "show": print(brief_text(work))
    elif sub == "apply": brief_apply(work)
    else: sys.exit("brief: ask [--hooks …] [--topics …] [--note …] [--file q.json] | wait | show | apply")
def cmd_media(work, args):
    sub = args[0] if args else ""
    def opt(name, d=None):
        if name in args: i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
        return d
    if sub == "search":
        n = int(opt("--n", 8)); vid = "--video" in args
        if vid: args.remove("--video")
        q = " ".join(args[1:])
        if vid:
            try: res = video_search(work, q, n)
            except Exception as e: sys.exit("البحث فشل (تأكد من النت): " + str(e)[:200])
            for i, r in enumerate(res): print("%d  %s  [%s · %s]  %dx%d · %s ث" % (i + 1, r["title"][:60], r["lic"], r["author"][:30] or "—", r["w"], r["h"], r["dur"]))
            print("ما لقيت مقاطع برخصة حرّة. جرّب استعلاماً إنجليزياً أبسط، أو ولّد المقطع من حسابه." if not res else "\nأضف واحد: python hs.py media <work> add <رقم> --at <ثانية> [--dur 4] [--from <ثانية البداية داخل المقطع>]"); return
        try: res = media_search(work, q, n)
        except Exception as e: sys.exit("البحث فشل (تأكد من النت): " + str(e)[:200])
        for i, r in enumerate(res): print("%d  %s  [%s · %s]  %dx%d" % (i + 1, r["title"][:60], r["lic"], r["author"][:30] or "—", r["w"], r["h"]))
        print("ما لقيت صوراً برخصة حرّة. جرّب استعلاماً إنجليزياً أبسط." if not res else "\nأضف وحدة: python hs.py media <work> add <رقم> --at <ثانية> [--dur 3] [--fit card|cover]")
    elif sub == "add":
        at = opt("--at", 0); dur = opt("--dur", None); fit = opt("--fit", None); frm = opt("--from", None); last = rj(J(work, ".hs", "media_last.json"), {}) or {}
        try: item = last["items"][int(args[1]) - 1]
        except Exception: sys.exit("رقم غير موجود. شغّل media search أول.")
        if item.get("kind") == "video":
            key, n = video_add(work, item, at, dur or 4, frm, fit if fit in ("fit", "crop") else None, print); print("انضاف المقطع %s (%.1f ث) عند %s ث (الرخصة: %s)" % (key, n / 30.0, at, item["lic"])); return
        dur = dur or 3; fit = fit or "card"
        lid, name = media_add(work, item, at, dur, fit); print("انضافت %s كطبقة %s عند %s ث (الرخصة: %s)" % (name, lid, at, item["lic"]))
    else: sys.exit("media: search \"query\" [--n 8] | add <n> --at <t> [--dur 3] [--fit card|cover]")
def cmd_gen(work, args):
    sub = args[0] if args else "list"
    def opt(name, d=None):
        if name in args: i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
        return d
    at = opt("--at"); fit = opt("--fit"); at = float(at) if at is not None else None
    try:
        if sub in ("request", "image", "video"):
            kind = args[1] if sub == "request" else sub; prompt = " ".join(args[2:] if sub == "request" else args[1:])
            if not prompt: sys.exit('gen: request image|video "وصف" [--at t] [--fit card|cover]')
            rid = gen_request(work, kind, prompt, at, fit or "card", by="claude"); r = gen_list(work)[-1]
            print("انحفظ طلب التوليد #%d (%s). ولّده من حساب المستخدم (%s) بهذا النص:\n  %s\nثم: python hs.py gen <work> import %d <الملف اللي نزل>" % (rid, kind, GEN_SITES[kind], gen_prompt(r), rid))
        elif sub == "list":
            q = gen_list(work)
            if not q: print("ما فيه طلبات توليد.")
            for r in q: print("#%d [%s] %s عند %s: %s%s" % (r["id"], "تمّ" if r["status"] == "done" else "ينتظر", "صورة" if r["kind"] == "image" else "مقطع", r.get("at"), r["prompt"], ("  ← " + r["file"]) if r.get("file") else ""))
            pend = [r for r in q if r["status"] != "done"]
            if pend: print("\nالنص الجاهز لكل طلب ينتظر:"); [print("  #%d → %s\n      %s" % (r["id"], GEN_SITES[r["kind"]], gen_prompt(r))) for r in pend]
        elif sub == "import":
            if len(args) < 3: sys.exit("gen: import <رقم الطلب أو -> <ملف> [--at t] [--fit card|cover]")
            print(json.dumps(gen_import(work, args[1], os.path.abspath(args[2]), at=at, fit=fit), ensure_ascii=False))
        elif sub == "rm": gen_rm(work, args[1]); print("انشال.")
        else: sys.exit('gen: request image|video "وصف" [--at t] | list | import <رقم> <ملف> | rm <رقم>')
    except RuntimeError as e: sys.exit(str(e))
def cmd_platform(names): print(platform_text([n for n in names if n in PLATFORMS] or None)); print("\nالمقاسات: " + " · ".join("%s = %d×%d" % (k, v[0], v[1]) for k, v in FRAMES.items()))
# ───────────────────────── 4.0: الدمج (أفكار HyperFrames و lemo-opuscar و gbro و onetake، مكتوبة من الصفر) ─────────────────────────
TR_TYPES = ("curve", "push", "pull", "rack", "whip", "spin", "iris", "flash", "punch", "zoom", "blur", "glitch", "shake")
HALLU = ["اشتركوا في القناة", "اشترك في القناة", "لا تنسوا الاشتراك", "ترجمة نانسي قنقر", "نانسي قنقر", "شكرا للمشاهدة", "شكرا على المشاهدة",
         "اشتركو في القناة", "سبتايتل", "ترجمة اسعد", "شكرا لكم على المشاهدة"]
VOICE_FX = {"clarity": "equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3000:t=q:w=1:g=2.5,",
            "deboom": "highpass=f=90,equalizer=f=200:t=q:w=1:g=-4,",
            "demud": "equalizer=f=250:t=q:w=1:g=-3,equalizer=f=4500:t=q:w=1:g=1.5,",
            "soft": "equalizer=f=3200:t=q:w=1:g=-3,equalizer=f=8000:t=q:w=1:g=-2,",
            "radio": "highpass=f=100,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=80,",
            "phone": "highpass=f=300,lowpass=f=3400,"}
def _ntxt(s): return " ".join(_norm(w) for w in str(s).split())
def audio_env(work, rate=50):
    """شدة الصوت كل 1/rate ثانية من cutz.mp4 (بايثون عادي، بلا مكتبات)."""
    import array
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", J(work, "cutz.mp4"), "-vn", "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
    a = array.array("h"); a.frombytes(raw[:len(raw) // 2 * 2]); hop = 8000 // rate
    return [sum(abs(x) for x in a[i:i + hop]) / hop for i in range(0, len(a), hop)], rate
def caps_regroup(work, max_words=6, max_dur=2.5, pause=0.5, comma=0.25):
    """يعيد تقسيم الكابشن على أنفاس الكلام بدل مقاطع whisper: قطع عند سكتة 0.5ث أو نهاية جملة أو فاصلة بعدها سكتة، 6 كلمات أو 2.5ث بالكثير، وما يترك كلمة يتيمة."""
    caps = rj(J(work, "caps.json")); words = [w for c in caps["cards"] for w in c["w"]]
    if not words: return 0, 0
    groups, cur = [], []
    for w in words:
        if cur:
            p = cur[-1]; gap = w["s"] - p["e"]; t = str(p["t"]).strip()
            if gap >= pause or re.search(r"[.!?؟…]$", t) or (re.search(r"[،,؛;:]$", t) and gap >= comma) or len(cur) >= max_words or (w["e"] - cur[0]["s"]) > max_dur:
                groups.append(cur); cur = []
        cur.append(w)
    if cur: groups.append(cur)
    out = []
    for g in groups:
        if len(g) == 1 and out and len(out[-1]) <= max_words and g[0]["s"] - out[-1][-1]["e"] < pause and not re.search(r"[.!?؟]$", str(out[-1][-1]["t"]).strip()): out[-1] = out[-1] + g
        else: out.append(g)
    cards = []
    for i, g in enumerate(out):
        s = max(0.0, g[0]["s"] - 0.08); e = g[-1]["e"] + 0.6
        if cards: s = max(s, cards[-1]["e"] + 0.02)
        if i + 1 < len(out): e = min(e, out[i + 1][0]["s"] - 0.05)
        cards.append({"s": round(min(s, g[0]["s"]), 3), "e": round(max(e, g[-1]["e"]), 3), "w": g})
    for i in range(len(cards) - 1):
        if cards[i]["e"] > cards[i + 1]["s"] - 0.02: cards[i]["e"] = round(max(cards[i]["w"][-1]["e"], cards[i + 1]["s"] - 0.02), 3)
    snapshot(work, "قبل تقسيم الكابشن"); old = len(caps["cards"]); caps["cards"] = cards; wj(J(work, "caps.json"), caps)
    return old, len(cards)
def caps_clean(work, dry=False):
    """يشيل جمل اخترعها whisper فوق السكوت (مثل «اشتركوا في القناة» أو «ترجمة نانسي قنقر»). يشيل الكابشن فقط، مو الفيديو."""
    caps = rj(J(work, "caps.json")); total = caps.get("total", 0); env, rate = audio_env(work)
    if not env: return []
    def lvl(a, b): seg = env[max(0, int(a * rate)):max(int(a * rate) + 1, int(b * rate))]; return sum(seg) / max(1, len(seg))
    sp = sorted(lvl(w["s"], w["e"]) for c in caps["cards"] for w in c["w"]); base = sp[len(sp) // 2] if sp else 1
    bad = []
    for i, c in enumerate(caps["cards"]):
        txt = _ntxt(card_key(c)); m = lvl(c["s"], c["e"]); hall = any(_ntxt(h) in txt for h in HALLU); quiet = m < 0.18 * base
        if (hall and (quiet or c["s"] > total - 2.5)) or m < 0.06 * base: bad.append(i)
    gone = [card_key(caps["cards"][i]) for i in bad]
    if bad and not dry:
        snapshot(work, "قبل تنظيف الكابشن"); caps["cards"] = [c for i, c in enumerate(caps["cards"]) if i not in bad]; wj(J(work, "caps.json"), caps)
    return gone
def cmd_caps(work, args):
    sub = args[0] if args else ""
    if sub == "regroup":
        kv = parse_kv(args[1:]); a, b = caps_regroup(work, int(kv.get("words", 6)), float(kv.get("dur", 2.5)), float(kv.get("pause", 0.5)))
        print("الكابشن صار على أنفاس الكلام: %d جملة ← %d" % (a, b))
        if (hs_of(load_studio(work)).get("en") or {}).get("map"): print("تنبيه: الترجمة كانت مربوطة بالجمل القديمة، أعد الترجمة (hs tr export/import).")
    elif sub == "clean":
        g = caps_clean(work, dry="--dry" in args)
        print(("انشالت %d جملة مخترعة:\n" % len(g) + "\n".join("  · " + x for x in g)) if g else "ما فيه جمل مخترعة.")
    else: sys.exit("caps: regroup [words=6 dur=2.5 pause=0.5] | clean [--dry]")

def looks_all(): return {k: v for k, v in (rj(os.path.join(HERE, "looks.json"), {}) or {}).items() if not k.startswith("_")}
def look_apply(work, name):
    st = load_studio(work); hs = hs_of(st)
    if name in ("off", "none", ""):
        hs.pop("look", None); hs.pop("grade", None); wj(J(work, "studio.json"), st); return "انشال الطابع."
    L = looks_all().get(name) or sys.exit("ما فيه طابع بهذا الاسم. شوف: hs look <work> list")
    hs["look"] = {"name": name, "overlay": L.get("overlay", "none"), "amount": L.get("amount", 0.5)}
    if L.get("grade"): hs["grade"] = {"preset": L["grade"], "amount": 0.85}
    hs.setdefault("cap", {}).update(L.get("cap") or {}); hs["cardDefault"] = dict(L.get("card") or {})
    for Ly in hs.get("layers") or []:
        if Ly.get("type") in ("split", "viz", "pip"): Ly.update({k: v for k, v in (L.get("card") or {}).items() if not (k == "deco" and Ly.get("type") == "viz")})
        if Ly.get("type") == "fx" and Ly.get("auto") in ("transitions", "trans") and L.get("tr"): Ly["fx"] = L["tr"]
    wj(J(work, "studio.json"), st); return "تطبّق الطابع: " + L.get("ar", name)
def cmd_look(work, args):
    sub = args[0] if args else "list"
    if sub == "list":
        for k, v in looks_all().items(): print("%-11s %s · طبقة %s · تلوين %s · انتقال %s" % (k, v.get("ar"), v.get("overlay"), v.get("grade"), v.get("tr")))
        print("طبّق: hs look <work> apply <الاسم> · شيله: hs look <work> off")
    elif sub == "apply" and len(args) > 1: print(look_apply(work, args[1]))
    elif sub == "off": print(look_apply(work, "off"))
    else: sys.exit("look: list | apply <name> | off")

def beat_detect(path, offset=0.0, sr=11025, hop=256):
    """يقيس إيقاع الموسيقى (بايثون عادي): الضربات، السرعة، وهل الموسيقى إيقاعية فعلاً أو هادية (لو هادية لا تقص على الضربة)."""
    import array, math
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True).stdout
    a = array.array("h"); a.frombytes(raw[:len(raw) // 2 * 2]); n = len(a) // hop
    if n < 50: return None
    e = [sum(x * x for x in a[i * hop:(i + 1) * hop]) / hop for i in range(n)]; le = [math.log10(1e-9 + x) for x in e]
    fl = [0.0] + [max(0.0, le[i] - le[i - 1]) for i in range(1, n)]; fps = sr / hop
    kk = (1, 2, 3, 2, 1); fs_ = [sum(kk[j] * fl[i + j - 2] for j in range(5) if 0 <= i + j - 2 < n) / 9.0 for i in range(n)]   # تنعيم بسيط عشان السرعة تنقاس صح
    lo, hi = int(fps * 60 / 180), int(fps * 60 / 60)
    ac = {L: sum(fs_[i] * fs_[i - L] for i in range(L, n)) for L in range(lo, hi + 1)}
    lag = max(ac, key=ac.get); mean_ac = sum(ac.values()) / len(ac); rhythmic = ac[lag] / max(1e-9, mean_ac) > 1.25 and sorted(fl)[int(n * 0.95)] > 0.15
    h = [L for L in (round(lag / 2) - 1, round(lag / 2), round(lag / 2) + 1) if L in ac]   # الضربة نص المدة؟ (خطأ الضعف المشهور)
    if h and max(ac[L] for L in h) >= 0.8 * ac[lag]: lag = max(h, key=ac.get)
    p = float(lag)
    if lag - 1 in ac and lag + 1 in ac:   # مدة بكسور (تمنع انزلاق الضربات مع الوقت)
        y0, y1, y2 = ac[lag - 1], ac[lag], ac[lag + 1]; d = (y0 - 2 * y1 + y2)
        if d < 0: p = lag + max(-0.5, min(0.5, 0.5 * (y0 - y2) / d))
    K = int((n - 1) / p)
    ph = max(range(lag), key=lambda o: sum(fl[int(round(o + k * p))] for k in range(K) if int(round(o + k * p)) < n))
    beats = [round(offset + (ph + k * p) / fps, 3) for k in range(K + 1) if ph + k * p < n]
    dn = max(range(4), key=lambda o: sum(fl[int(round(ph + (o + 4 * k) * p))] for k in range(len(beats) // 4) if int(round(ph + (o + 4 * k) * p)) < n))
    strong = beats[dn::4]
    return {"bpm": round(60 * fps / p, 1), "beats": beats, "strong": strong, "rhythmic": rhythmic, "src": os.path.basename(path), "offset": offset}
def cmd_beat(work, args):
    src = args[0] if args else ""; at = 0.0
    if "--at" in args: at = float(args[args.index("--at") + 1])
    if src.startswith("my") or src.startswith("mk"):
        sfx = rj(J(work, "sfx.json"), {}) or {}; v = (sfx.get(src) or [[0]])[0]; at = float((v if isinstance(v, list) else [v])[0]); src = os.path.join(sfx_dir(), src + ".wav")
    if not src:
        for nme in ("bg-audio", "bg", "music"):
            for ext in ("mp3", "m4a", "wav", "aac"):
                if os.path.exists(J(work, nme + "." + ext)): src = J(work, nme + "." + ext); break
            if src: break
    if not src or not os.path.exists(src): sys.exit("beat: عطني ملف الموسيقى (مسار، أو my2 من أصواته، أو bg-audio.mp3 بمجلد المشروع)")
    r = beat_detect(src, at) or sys.exit("الملف قصير أو ما انقرأ")
    wj(J(work, "beats.json"), r)
    print("السرعة %.0f ضربة/دقيقة · %d ضربة · %s" % (r["bpm"], len(r["beats"]), "إيقاعية: تقدر تقص على الضربة" if r["rhythmic"] else "هادية: لا تقص على الضربات، امش على الجمل"))

def cards_hint(total, density="some"):
    base = 7 if total < 60 else 10 if total < 180 else 15
    k = {"few": 1.5, "some": 1.0, "many": 0.7}.get(density, 1.0)
    return 0 if density == "none" else max(1, int(round(total / (base * k))))
def flow_tips(work, ev, total, hs):
    """نصايح الإيقاع والقراءة (مستوحاة من فحوص HyperFrames و onetake، مكتوبة من جديد)."""
    tips = []; iv = [b - a for a, b in zip(ev, ev[1:]) if b - a > 0.05]
    if len(iv) >= 5 and total > 12:
        m = sum(iv) / len(iv); sd = (sum((x - m) ** 2 for x in iv) / len(iv)) ** 0.5
        if m > 0 and sd / m < 0.25: tips.append({"t": 0, "k": "cadence", "msg": "التغييرات تجي على مسافات متساوية فتحس إنه عرض شرائح. نوّع: لحظة سريعة ولحظة هادية."})
        if max(iv) < 1.0: tips.append({"t": 0, "k": "rest", "msg": "ما فيه ولا لحظة هدوء ثانية كاملة. خلّ نفس قبل أهم جملة."})
    for L in hs.get("layers") or []:
        if L.get("off") or L.get("type") not in ("text", "lt", "cover"): continue
        txt = (L.get("text") or "") + (L.get("sub") or ""); n = len(re.sub(r"\s", "", txt))
        if not n: continue
        need = n / 12.0 + (0.4 if L.get("type") == "cover" else 1.0); have = float(L.get("e", 0)) - float(L.get("s", 0))
        if have < need * 0.8: tips.append({"t": L.get("s", 0), "k": "read", "msg": "«%s» يحتاج %.1f ث عشان ينقرا، وهو %.1f ث بس." % (txt.split("\n")[0][:24], need, have)})
    trs = [L for L in hs.get("layers") or [] if L.get("type") == "fx" and L.get("fx") in ("curve", "push", "pull", "rack", "whip", "spin", "iris")]
    if len(set(L.get("fx") for L in trs)) > 3: tips.append({"t": 0, "k": "trmix", "msg": "فيه أكثر من 3 أنواع انتقال. خلّها نوعين أو ثلاثة بالكثير."})
    if len(set(L.get("dir") or hs.get("trDir") or "right" for L in trs if L.get("fx") in ("curve", "whip"))) > 1: tips.append({"t": 0, "k": "trdir", "msg": "الانتقالات تمشي باتجاهات مختلفة. خلّها اتجاه واحد بكل المقطع."})
    br = rj(J(work, "brief.json"), {}) or {}; want = cards_hint(total, br.get("cards", "some")) if br else 0
    have = sum(1 for L in hs.get("layers") or [] if not L.get("off") and (L.get("type") in ("split", "pip") or (L.get("type") == "viz" and L.get("kind") in ("card", "draw"))))
    if want and have < max(1, want // 2): tips.append({"t": 0, "k": "cards", "msg": "كروت الشرح %d، والمناسب لطول المقطع واختياره تقريباً %d." % (have, want)})
    return tips

def cmd_auto(work, args):
    kind = args[0] if args else "";
    if kind == "clear": kind = args[1]; print("انشالت."); auto_layers(work, kind, False); return
    if kind not in ("zooms", "transitions", "beats"): sys.exit("auto: zooms | transitions [type=curve dir=right] | beats | clear zooms|transitions|beats")
    print("انضاف %d %s" % (auto_layers(work, kind, True, parse_kv(args[1:])), {"zooms": "تقريب عند الكلمات المميّزة", "transitions": "انتقال عند تغيّر الفكرة", "beats": "ضربة على الإيقاع"}[kind]))

# ───────────────────────── الفحص الذاتي (3.1) ─────────────────────────
MOJIBAKE = ("\ufffd", "\u00d8\u00a7", "\u00d9\u201e", "\u00d8\u00b9", "\u00c3\u02dc", "\u00e2\u20ac")
def cmd_selftest(work=None, engine=None):
    """يفحص ملفات الاستوديو نفسها: الصياغة · سلامة النص العربي · اكتمال مفاتيح الواجهة باللغتين · الخط · (ومع <work>) الخادم يرد."""
    bad = []; n_ok = 0
    def chk(name, good, detail=""):
        nonlocal n_ok
        if good: n_ok += 1
        else: bad.append(name + ((": " + detail) if detail else ""))
        print(("OK   " if good else "خطأ  ") + name + ((" ← " + detail) if (detail and not good) else ""))
    files = ["hs.py", "ext.js", "app.js", "i18n.js", "qr.js", "studio.html", "review.html", "AGENT.md", "README.md", "SKILL.md"]; txt = {}
    for f in files:
        fp = os.path.join(HERE, f)
        if not os.path.isfile(fp): chk("موجود: " + f, False); continue
        try: txt[f] = open(fp, encoding="utf-8").read()
        except UnicodeDecodeError as e: chk("ترميز UTF-8: " + f, False, str(e)[:80]); continue
        hit = [m for m in MOJIBAKE if m in txt[f]] if f != "qr.js" else []
        chk("النص سليم: " + f, not hit, "فيه حروف خربانة " + repr(hit))
    if not os.path.isfile(os.path.join(HERE, "fonts", "nt-panorama-naskh-long.otf")): print("ملاحظة: خط الواجهة الخاص مو موجود في fonts/، الواجهة تشتغل بالخط البديل")
    eng0 = find_engine(engine); chk("المحرّك engine كامل", bool(eng0) and all(os.path.exists(os.path.join(eng0, p)) for p in ("studio/studio.py", "scripts/04_render_frames.js", "scripts/21_vision.js", "vision/vision_bundle.mjs", "vision/wasm/vision_wasm_internal.wasm", "vision/selfie_segmentation.tflite", "vision/face_detection_short_range.tflite", "scripts/compose.REFERENCE.html", "scripts/03_cut_zoom.py", "scripts/05_sfx.py", "scripts/06b_master.sh", "MONTAGE.md")), "ملفات ناقصة من engine")
    try: compile(txt.get("hs.py", ""), "hs.py", "exec"); chk("صياغة hs.py", True)
    except SyntaxError as e: chk("صياغة hs.py", False, str(e))
    if shutil.which("node"):
        for f in ("ext.js", "app.js", "i18n.js"):
            r = subprocess.run(["node", "--check", os.path.join(HERE, f)], capture_output=True, text=True); chk("صياغة " + f, r.returncode == 0, (r.stderr or "").strip().split("\n")[-1][:160])
    else: print("تخطّي فحص صياغة الجافاسكربت: node مو موجود")
    i18 = txt.get("i18n.js", ""); app = txt.get("app.js", ""); html = txt.get("studio.html", "") + txt.get("review.html", "")
    ent = dict((m.group(1), (m.group(2), m.group(3))) for m in re.finditer(r"(?:^|[\s,{])([A-Za-z_]\w*):\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\]", i18))
    chk("قاموس الواجهة انقرأ (%d مفتاح)" % len(ent), len(ent) > 200)
    used = set(k for k in re.findall(r"\bt\('([A-Za-z_]\w*)'", app) if not k.endswith("_")) | set(re.findall(r'data-t(?:-title|-ph)?="([A-Za-z_]\w*)"', html))
    def lst(name):
        m = re.search(name + r"\s*=\s*\[([^\]]*)\]", app); return re.findall(r"'([^']+)'", m.group(1)) if m else []
    bo = re.search(r"const B_OPTS=\{(.*?)\};", app, re.S); bvals = re.findall(r"'([^']+)'", bo.group(1)) if bo else []
    used |= set("b_" + v for v in bvals if not re.match(r"^\d", v)) | set("bf_" + v.replace(":", "x") for v in bvals if re.match(r"^\d", v))
    cp = re.search(r"const CAPPRE=\{(.*?)\} \};", app, re.S); cps = re.findall(r"(?:^|[\s,{])(\w+):\{font:", cp.group(1) + "}" if cp else "")
    chk("ستايلات الكابشن (%d)" % len(cps), len(cps) >= 12)
    try: lk = looks_all(); chk("الطوابع (%d)" % len(lk), len(lk) >= 8 and all(isinstance(v, dict) and v.get("card") for v in lk.values()))
    except Exception as e: chk("الطوابع", False, str(e)[:80])
    chk("أدوات 4.0 بالإضافة", all(x in txt.get("ext.js", "") for x in ("trDraw", "markLayer", "cursorLayer", "ltLayer", "collages", "gradeOf", "lookOverlay", "VK.line")))
    used |= set("cp_" + k for k in cps) | set("en_" + k for k in lst("const ENTERS")) | set("char_" + k for k in lst("const CHARS"))
    miss = sorted(k for k in used if k not in ent); chk("كل مفاتيح الواجهة المستخدمة موجودة بالقاموس (%d)" % len(used), not miss, "ناقص: " + "، ".join(miss[:14]))
    empty = sorted(k for k, (a, e) in ent.items() if not a.strip() or not e.strip()); chk("كل مفتاح له نص عربي وإنجليزي", not empty, "فاضي: " + "، ".join(empty[:10]))
    noar = sorted(k for k, (a, e) in ent.items() if not re.search(r"[؀-ۿ]", a) and re.search(r"[A-Za-z]{4,}", a) and a == e and k not in ("b_tiktok",))
    if noar: print("ملاحظة: مفاتيح عربيّها نفس الإنجليزي (أسماء علم غالباً): " + "، ".join(noar[:12]))
    for k, v in PLATFORMS.items(): chk("منصة %s كاملة" % k, len(v["safe"]) == 4 and v["tips"] and all(f in FRAMES for f in v["frames"]) and ("b_" + k) in ent)
    sz = safe_of(["tiktok", "instagram"]); chk("حساب المنطقة الآمنة", sz["capMax"] == 67.0 and sz["capMin"] == 18.0, json.dumps(sz))
    chk("حساب القص 4:5", safe_of([], "4:5")["crop"] == [11.77, 82.08], json.dumps(safe_of([], "4:5")))
    if work and os.path.isdir(work):
        eng = find_engine(engine)
        if not eng: chk("المحرّك موجود لفحص الخادم", False)
        else:
            port = 8700 + secrets.randbelow(80); pr = subprocess.Popen([PY, os.path.abspath(__file__), "serve", work, "--port", str(port), "--engine", eng], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            try:
                up = False
                for _ in range(40):
                    time.sleep(0.25)
                    try: urllib.request.urlopen("http://127.0.0.1:%d/hs/info" % port, timeout=2).read(); up = True; break
                    except Exception: pass
                chk("الخادم اشتغل", up)
                for path, need in (("/", b"app.js"), ("/hs/app.js", b"CAPPRE"), ("/hs/i18n.js", b"I18N"), ("/hs/info", b'"safe"'), ("/hs/brief", b'"cards"'), ("/hs/pulse", b'"sig"'), ("/review", b"<")) + ((("/hs/ui-font.otf", b"OTTO"),) if os.path.isfile(os.path.join(HERE, "fonts", "nt-panorama-naskh-long.otf")) else ()):
                    try: body = urllib.request.urlopen("http://127.0.0.1:%d%s" % (port, path), timeout=8).read(); chk("يرد " + path, need in body, "الرد ما فيه المتوقع")
                    except Exception as e: chk("يرد " + path, False, str(e)[:100])
            finally: pr.kill()
    print("\n%s: %d فحص سليم%s" % ("كل شي سليم" if not bad else "فيه مشاكل", n_ok, ("، %d خطأ" % len(bad)) if bad else ""))
    return not bad

# ───────────────────────── أوامر الطرفية (يستخدمها Claude) ─────────────────────────
def parse_kv(args):
    o = {}
    for a in args:
        k, _, v = a.partition("=")
        try: o[k] = json.loads(v)
        except Exception: o[k] = v.replace("\\n", "\n")
    return o
def cmd_text(work, args):
    caps = rj(J(work, "caps.json"))
    if not args or args[0] == "show":
        for i, c in enumerate(caps["cards"]): print("%2d  %6.2f-%6.2f  %s" % (i + 1, c["s"], c["e"], card_key(c)))
        return
    i = int(args[0]) - 1
    if not (0 <= i < len(caps["cards"])): sys.exit("رقم الجملة برّا المدى (1-%d)" % len(caps["cards"]))
    apply_text(work, i, " ".join(args[1:])); print("تم: الجملة %d ← %s" % (i + 1, " ".join(args[1:])))
def cmd_notes(work, args):
    path = J(work, "notes.json"); notes = rj(path, []) or []; caps = rj(J(work, "caps.json"), {"cards": []}); sub = args[0] if args else "list"
    if sub == "list":
        todo = [n for n in notes if n.get("status") != "done"]
        if not todo: print("ما فيه ملاحظات مفتوحة."); return
        for n in todo:
            ci = n.get("card"); ctx = card_key(caps["cards"][ci]) if isinstance(ci, int) and 0 <= ci < len(caps["cards"]) else ""
            pin = n.get("pin"); pin_s = (" · المؤشر على الشاشة: x=%d y=%d (من 1080×1920)" % (pin["x"] * 1080, pin["y"] * 1920)) if pin else ""
            print("#%s  عند %.2f ث%s\n   الملاحظة: %s\n   الجملة: %s%s" % (n["id"], n["t"], pin_s, n["text"], ctx or "—", ("\n   لقطة: " + J(work, n["img"])) if n.get("img") else ""))
        print("\nبعد كل ملاحظة تنفّذها: python hs.py notes <work> done <id> \"وش سويت\"")
    elif sub in ("done", "reopen"):
        for n in notes:
            if str(n["id"]) == str(args[1]):
                n["status"] = "done" if sub == "done" else "open"
                if sub == "done": n["reply"] = " ".join(args[2:]); n["doneAt"] = time.strftime("%Y-%m-%d %H:%M")
                wj(path, notes); print("تم:", args[1], n["status"]); return
        sys.exit("ما لقيت ملاحظة برقم " + str(args[1]))
    else: sys.exit("notes: list | done <id> \"…\" | reopen <id>")
def cmd_tr(work, args):
    sp = J(work, "studio.json"); st = load_studio(work); hs = hs_of(st); en = hs.setdefault("en", {}); mp = en.setdefault("map", {})
    caps = rj(J(work, "caps.json")); sub = args[0] if args else "export"
    if sub == "export":
        out = [{"i": i, "ar": card_key(c), "en": mp.get(card_key(c), "")} for i, c in enumerate(caps["cards"])]
        print(json.dumps(out, ensure_ascii=False, indent=1)); print("\n# ناقص ترجمة: %d من %d" % (sum(1 for o in out if not o["en"]), len(out)), file=sys.stderr)
    elif sub == "import":
        data = rj(args[1]); n = 0
        items = data.items() if isinstance(data, dict) else [((o.get("ar") or card_key(caps["cards"][o["i"]])), o.get("en", "")) for o in data]
        for ar, e in items:
            if e and e.strip(): mp[ar] = e.strip(); n += 1
        en["on"] = True; hs.setdefault("cap", {})["on"] = True; wj(sp, st); print("انحفظت %d ترجمة · الترجمة شغّالة" % n)
    else: sys.exit("tr: export | import <file.json>")
def cmd_set(work, args):
    sp = J(work, "studio.json"); st = load_studio(work); hs = hs_of(st)
    for k, val in parse_kv(args).items():
        cur = hs; parts = k.split(".")
        for p in parts[:-1]: cur = cur.setdefault(p, {})
        cur[parts[-1]] = val
    wj(sp, st); print(json.dumps({k: v for k, v in hs.items() if k in ("cap", "en", "mix", "hooks", "check")}, ensure_ascii=False)[:900])
def cmd_layer(work, args):
    sp = J(work, "studio.json"); st = load_studio(work); hs = hs_of(st); Ls = hs.setdefault("layers", []); sub = args[0] if args else "list"
    if sub == "list":
        for L in Ls: print("%-4s %-5s %6.2f-%6.2f  %s" % (L["id"], L["type"], L["s"], L["e"], json.dumps({k: v for k, v in L.items() if k not in ("id", "type", "s", "e")}, ensure_ascii=False)[:150]))
        if not Ls: print("ما فيه طبقات.")
        return
    if sub == "add":
        o = parse_kv(args[1:])
        if o.get("type") not in ("text", "image", "char", "fx", "split", "viz", "cover", "bg", "behind", "pip", "mark", "cursor", "lt", "collage"): sys.exit("type لازم: text | image | char | fx | split | viz | cover | bg | behind | pip | mark | cursor | lt | collage")
        if o["type"] in ("split", "viz", "pip"):
            for k2, v2 in (hs.get("cardDefault") or {}).items(): o.setdefault(k2, v2) if not (k2 == "deco" and o["type"] == "viz") else None
        for k in ("text", "title"):
            if isinstance(o.get(k), str): o[k] = o[k].replace("\\n", "\n")
        o.setdefault("s", 0); o.setdefault("e", float(o["s"]) + ({"split": 5, "viz": 5, "cover": 0.9, "pip": 5, "collage": 4, "mark": 2.5, "lt": 4}.get(o["type"], 3))); o["id"] = new_id(Ls); o.setdefault("track", {"fx": 2, "text": 1, "split": 2, "viz": 2, "cover": 2, "behind": 1, "mark": 1, "cursor": 1, "lt": 1, "collage": 2, "pip": 2}.get(o["type"], 0)); Ls.append(o); wj(sp, st); print(o["id"])
        if o["type"] in ("bg", "behind", "split", "pip") or (o["type"] == "viz"):
            try: vision_ensure(work)
            except Exception as e: print("تنبيه: " + str(e)[:160])
        return
    L = next((x for x in Ls if x["id"] == (args[1] if len(args) > 1 else "")), None) or sys.exit("ما لقيت الطبقة")
    if sub == "set":
        kv = parse_kv(args[2:])
        for k in ("text", "title"):
            if isinstance(kv.get(k), str): kv[k] = kv[k].replace("\\n", "\n")
        L.update(kv); wj(sp, st); print("تم:", L["id"])
        if L.get("type") in ("bg", "behind"):
            try: vision_ensure(work)
            except Exception as e: print("تنبيه: " + str(e)[:160])
    elif sub == "rm": Ls.remove(L); wj(sp, st); print("انحذفت:", L["id"])
    else: sys.exit("layer: list | add k=v … | set <id> k=v … | rm <id>")
def cmd_hook(work, args):
    sp = J(work, "studio.json"); st = load_studio(work); hk = hs_of(st).setdefault("hooks", {"dur": 2.6, "style": "box", "active": 0, "items": []}); sub = args[0] if args else ""
    if sub == "set": hk["items"] = [{"text": t.replace("\\n", "\n")} for t in args[1:]]; hk["on"] = True; hk["active"] = 0
    elif sub == "active": hk["active"] = int(args[1]) - 1
    elif sub == "off": hk["on"] = False
    else: sys.exit("hook: set \"…\" \"…\" | active <n> | off")
    wj(sp, st); print(json.dumps(hk, ensure_ascii=False))
def cmd_check(work):
    c = check(work); caps = rj(J(work, "caps.json"))
    print("درجة الفحص: %d/100 · المدة %.1f ث" % (c["score"], c["total"]))
    if c["firstCap"] is not None and c["firstCap"] > 1.0: print("⚠ أول كلمة تبدأ عند %.2f ث (المفروض قبل الثانية 1)" % c["firstCap"])
    for g in c["gaps"]: print("⚠ %.1f ث بلا تغيير بصري: %.2f ← %.2f" % (g["d"], g["s"], g["e"]))
    for l in c["longCaps"]: print("⚠ الجملة %d طويلة (%d كلمة)" % (l["card"] + 1, l["n"]))
    for f in c["fillers"]: print("حشو: «%s» بالجملة %d عند %.2f" % (f["t"], f["card"] + 1, f["s"]))
    for d in c["dupes"]: print("إعادة: الجملة %d تشبه %d (%d٪)\n   %s\n   %s" % (d["a"] + 1, d["b"] + 1, d["r"] * 100, card_key(caps["cards"][d["a"]]), card_key(caps["cards"][d["b"]])))
    for tp in c.get("tips") or []: print("نصيحة: " + tp["msg"])
    if not (c["gaps"] or c["longCaps"] or c["fillers"] or c["dupes"] or c.get("tips")): print("ما فيه ملاحظات.")
def brand_dir(): d = os.path.join(HOME_CFG, "brands"); os.makedirs(d, exist_ok=True); return d
def brand_pack(work):
    hs = load_studio(work).get("hs") or {}; th = rj(J(work, "theme.json"), {}) or {}
    return {"cap": hs.get("cap") or {}, "en": {k: v for k, v in (hs.get("en") or {}).items() if k != "map"}, "fonts": hs.get("fonts") or [],
            "theme": {k: th[k] for k in ("bg", "ink", "acc", "clay", "mut", "font", "handle") if k in th}}
def brand_apply(work, b):
    sp = J(work, "studio.json"); st = load_studio(work); hs = hs_of(st)
    hs["cap"] = {**(hs.get("cap") or {}), **(b.get("cap") or {})}; hs["en"] = {**(hs.get("en") or {}), **(b.get("en") or {})}; wj(sp, st)
    tp = J(work, "theme.json"); th = rj(tp, {}) or {}; th.update(b.get("theme") or {}); wj(tp, th)
def cmd_brand(work, args):
    sub = args[0] if args else "list"
    if sub == "list": print("\n".join(sorted(os.path.splitext(f)[0] for f in os.listdir(brand_dir()))) or "ما فيه هويات محفوظة.")
    elif sub == "save": wj(os.path.join(brand_dir(), args[1] + ".json"), brand_pack(work)); print("انحفظت الهوية:", args[1])
    elif sub == "apply": brand_apply(work, rj(os.path.join(brand_dir(), args[1] + ".json")) or sys.exit("ما لقيت هوية: " + args[1])); print("انطبقت الهوية:", args[1])
    else: sys.exit("brand: list | save <name> | apply <name>")
def cmd_status(work):
    for s in stages(work): print(("✓ " if s["done"] else "· ") + s["ar"] + (" (%d٪)" % s["pct"] if s.get("pct") else ""))
    for e in activity(work)[-6:]: print("  [%s] %s" % (time.strftime("%H:%M", time.localtime(e["t"])), e["text"]))
    u = J(work, ".hs", "url.txt")
    if os.path.exists(u): print(open(u).read().strip())
def cmd_doctor(engine):
    ok = True
    def chk(name, good, hint=""):
        nonlocal ok; ok = ok and bool(good); print(("OK   " if good else "ناقص ") + name + ("" if good else "  ← " + hint))
    eng = find_engine(engine); chk("المحرّك (مجلد engine)", eng, "مجلد engine ناقص من مجلد السكل: نزّل السكل كامل من جديد")
    if eng: print("     " + eng); remember_engine(eng)
    for tool in ("ffmpeg", "ffprobe", "node"): chk(tool, shutil.which(tool), "ثبّته وأضفه للـPATH")
    fix_windows_path()
    if os.name == "nt": chk("Git Bash", shutil.which("bash"), "ثبّت Git for Windows")
    chk("ملفات الاستوديو", all(os.path.exists(os.path.join(HERE, f)) for f in ("studio.html", "app.js", "i18n.js", "ext.js", "qr.js", "review.html", "AGENT.md")), "أعد نسخ مجلد hojas-studio")
    print(("OK   " if shutil.which("claude") else "—    ") + "Claude Code (لزر «نفّذ» داخل الاستوديو)" + ("" if shutil.which("claude") else "  ← اختياري: بدونه تنسخ الطلب وتلصقه في المحادثة"))
    eng2 = find_engine(engine); vis = bool(eng2) and all(os.path.exists(os.path.join(eng2, "vision", f)) for f in ("vision_bundle.mjs", "wasm/vision_wasm_internal.wasm", "selfie_segmentation.tflite", "face_detection_short_range.tflite"))
    print(("OK   " if vis else "—    ") + "ملفات العين (engine/vision): مكان الوجه وقص الشخص" + ("" if vis else "  ← ناقصة: الكروت تشتغل بس بدون ضبط الوجه وبدون تغيير الخلفية"))
    print("\nالنتيجة:", "جاهز" if ok else "فيه نواقص فوق")
    if not ok: print("\nقبل ما تثبّت أي شي: اعرض على المستخدم ناتج `python hs.py tools` (وش كل أداة وليش) وخذ موافقته.")
    return ok

def port_alive(port, work=None):
    try:
        with urllib.request.urlopen("http://127.0.0.1:%d/hs/info" % port, timeout=1.2) as r: d = json.loads(r.read().decode())
        return (os.path.normcase(os.path.abspath(d.get("work", ""))) == os.path.normcase(os.path.abspath(work))) if work else True
    except Exception: return False
def port_free(port):
    s = socket.socket()
    try: s.bind(("0.0.0.0", port)); return True
    except OSError: return False
    finally: s.close()
def cmd_open(work, port, engine, browser=True):
    os.makedirs(J(work, ".hs"), exist_ok=True); eng = find_engine(engine) or sys.exit("ما لقيت مجلد engine بجنب hs.py — نزّل السكل كامل من جديد")
    remember_engine(eng); use = None
    for p in range(port, port + 20):
        if port_alive(p, work): use = p; break
    if use is None:
        use = next((p for p in range(port, port + 20) if port_free(p)), None) or sys.exit("ما لقيت بورت فاضي")
        lg = open(J(work, ".hs", "server.log"), "ab"); kw = {"stdin": subprocess.DEVNULL, "stdout": lg, "stderr": lg, "cwd": work}
        if os.name == "nt": kw["creationflags"] = 0x00000008 | 0x00000200 | 0x08000000      # DETACHED · NEW_GROUP · NO_WINDOW
        else: kw["start_new_session"] = True
        subprocess.Popen([PY, os.path.abspath(__file__), "serve", work, "--port", str(use), "--engine", eng], **kw)
        for _ in range(60):
            if port_alive(use, work): break
            time.sleep(0.25)
        else: sys.exit("الخادم ما اشتغل — شوف " + J(work, ".hs", "server.log"))
    url = "http://127.0.0.1:%d/" % use
    if browser:
        try:
            import webbrowser; webbrowser.open(url)
        except Exception: pass
    print("الاستوديو شغّال: " + url); u = J(work, ".hs", "url.txt")
    if os.path.exists(u): print(open(u).read().strip().split("\n")[-1])

# ───────────────────────── الخادم ─────────────────────────
def serve(work, port, engine):
    eng = find_engine(engine) or sys.exit("ما لقيت مجلد engine بجنب hs.py — نزّل السكل كامل من جديد (شغّل: python hs.py doctor)")
    remember_engine(eng); fix_windows_path(); os.makedirs(work, exist_ok=True); changed = patch(work, quiet=True)
    D = J(work, ".hs"); os.makedirs(D, exist_ok=True)
    sys.argv = [os.path.join(eng, "studio", "studio.py"), work, str(port)]
    spec = importlib.util.spec_from_file_location("hs_base_studio", sys.argv[0]); base = importlib.util.module_from_spec(spec); spec.loader.exec_module(base)
    P = base.P; S = base.S
    def tok(name, n):
        p = os.path.join(D, name)
        if os.path.exists(p): return open(p).read().strip()
        v = ("%0" + str(n) + "d") % secrets.randbelow(10 ** n); open(p, "w").write(v); return v
    TOKEN = tok("token", 6); RTOKEN = tok("rtoken", 8)
    LAN = base.lan_ip(); BG = {"thumbsDone": False, "mt": None, "patched": bool(changed is not None)}
    AG = {"running": False, "proc": None, "started": 0}; VIS = {"busy": False, "what": "", "retry": 0}
    FAILS = {}; FAILS_ALL = [0]

    def peaks():
        src = P("cutz.mp4"); cp = os.path.join(D, "peaks.json")
        if not os.path.exists(src): return {"rate": 50, "p": []}
        mt = int(os.path.getmtime(src)); c = rj(cp)
        if c and c.get("mt") == mt: return c
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "4000", "-f", "s16le", "-"], capture_output=True).stdout
        a = array.array("h"); a.frombytes(raw[: len(raw) // 2 * 2])
        if sys.byteorder == "big": a.byteswap()
        step = 80; p = [max((abs(x) for x in a[i:i + step]), default=0) for i in range(0, len(a), step)]
        mx = max(p) if p else 1; c = {"mt": mt, "rate": 50, "p": [round(x / (mx or 1), 3) for x in p]}; wj(cp, c); return c
    def build_thumbs():
        src = P("cutz.mp4"); td = os.path.join(D, "th")
        if not os.path.exists(src): BG["thumbsDone"] = True; return
        stamp = os.path.join(td, ".mt"); mt = str(int(os.path.getmtime(src)))
        if os.path.exists(stamp) and open(stamp).read() == mt: BG["thumbsDone"] = True; return
        shutil.rmtree(td, ignore_errors=True); os.makedirs(td)
        subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=1,scale=-2:128", "-q:v", "6", "-y", os.path.join(td, "%04d.jpg")], capture_output=True)
        open(stamp, "w").write(mt); BG["thumbsDone"] = True
    def refresh_bg(): BG["thumbsDone"] = False; threading.Thread(target=build_thumbs, daemon=True).start()
    def housekeeping():
        """يتابع الملفات: يركّب الإضافة أول ما يطلع compose.html، ويعيد بناء الصور المصغّرة لو تغيّر الفيديو."""
        if os.path.exists(P("compose.html")):
            try: patch(work, quiet=True)
            except Exception: pass
        mt = int(os.path.getmtime(P("cutz.mp4"))) if os.path.exists(P("cutz.mp4")) else None
        if mt != BG["mt"]: BG["mt"] = mt; refresh_bg()
        if not VIS["busy"] and time.time() > VIS["retry"] and not base.JOB["running"] and ready(work):
            try: todo_v = face_stale(work) or bool(mask_need(work))
            except Exception: todo_v = False
            if todo_v:
                VIS.update(busy=True, what="face" if face_stale(work) else "mask")
                def vgo():
                    try:
                        did = vision_ensure(work, base.log)
                        if any(x.endswith("!") for x in did) or face_stale(work) or mask_need(work): VIS["retry"] = time.time() + 90
                    except Exception as e: VIS["retry"] = time.time() + 90; base.log("vision: " + str(e)[:200])
                    finally: VIS["busy"] = False
                threading.Thread(target=vgo, daemon=True).start()
    def aux_sig():
        o = 0
        for f in ("hs-face.js", "hs-mask.js"):
            try: o += int(os.path.getmtime(P(f)) * 10)
            except OSError: pass
        return o
    AUL = threading.Lock()
    def audio_file():
        """صوت المقطع لحاله (أخف من تحميل الفيديو كامل، ويبدأ فوراً على الجوال)."""
        src = P("cutz.mp4")
        if not os.path.exists(src): return None
        f = os.path.join(D, "au-%s.m4a" % vsig(work))
        with AUL:
            if not os.path.exists(f):
                for old in glob.glob(os.path.join(D, "au-*.m4a")):
                    try: os.remove(old)
                    except OSError: pass
                tmp = f + ".part.m4a"; r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", tmp], capture_output=True)
                if r.returncode or not os.path.exists(tmp): return None
                os.replace(tmp, f)
        return f

    def versions():
        vd = os.path.join(D, "versions"); out = []
        if os.path.isdir(vd):
            for n in sorted(os.listdir(vd), reverse=True):
                meta = rj(os.path.join(vd, n, "meta.json"), {}) or {}; out.append({"id": n, "name": meta.get("name", n), "at": meta.get("at", "")})
        return out
    def ver_restore(vid):
        vd = os.path.join(D, "versions", os.path.basename(vid))
        if not os.path.isdir(vd): raise ValueError("ما لقيت النسخة")
        old_keep = (rj(P("cut.json"), {}) or {}).get("keep"); snapshot(work, "قبل الاسترجاع (تلقائي)")
        for f in SNAP_FILES:
            if os.path.exists(os.path.join(vd, f)): shutil.copy(os.path.join(vd, f), P(f))
        return (rj(P("cut.json"), {}) or {}).get("keep") != old_keep            # تغيّر القص ← لازم إعادة بناء الفيديو
    def gen_view(q): return [{**r, "site": GEN_SITES[r["kind"]], "text": gen_prompt(r)} for r in q][-12:]
    def exports():
        ed = os.path.join(D, "exports"); return sorted(os.listdir(ed), reverse=True) if os.path.isdir(ed) else []
    def latest_preview():
        best = None
        for pat in ("sheet.jpg", "prev/*.jpg", "safe.jpg", "hook_sheet.jpg"):
            for f in glob.glob(P(pat)):
                m = os.path.getmtime(f)
                if not best or m > best[1]: best = (os.path.relpath(f, work).replace("\\", "/"), m)
        return {"path": best[0], "mt": int(best[1])} if best else None
    def notes_md(notes, caps):
        L = ["# ملاحظات الاستوديو", "", "المشروع: " + work, ""]
        for n in notes:
            if n.get("status") == "done": continue
            ci = n.get("card"); ctx = card_key(caps["cards"][ci]) if isinstance(ci, int) and 0 <= ci < len(caps["cards"]) else "—"
            L += ["## #%s عند %.2f ث" % (n["id"], n["t"]), "- الملاحظة: " + n["text"], "- الجملة وقتها: " + ctx]
            if n.get("pin"): L.append("- المؤشر على الشاشة: x=%d y=%d (من 1080×1920)" % (n["pin"]["x"] * 1080, n["pin"]["y"] * 1920))
            if n.get("img"): L.append("- لقطة: " + n["img"])
            L.append("")
        return "\n".join(L)
    def review(): return rj(P("review.json"), {"approved": None, "comments": []}) or {"approved": None, "comments": []}

    # ── تشغيل Claude Code من الاستوديو ──
    def agent_run(task, label, gen=False):
        exe = shutil.which("claude")
        if not exe: return False, "ما لقيت Claude Code على الجهاز"
        if AG["running"]: return False, "Claude شغّال الحين على طلب سابق"
        cmd = [exe, "-p", "Follow the task given on stdin. Work only inside the current project folder.", "--output-format", "stream-json", "--verbose",
               "--permission-mode", "acceptEdits", "--append-system-prompt-file", os.path.join(HERE, "AGENT.md"),
               "--add-dir", HERE, eng, "--allowedTools", "Bash", "Read", "Edit", "Write", "Glob", "Grep"] + (["mcp__claude-in-chrome", "mcp__higgsfield", "WebSearch", "WebFetch"] if gen else [])
        if exe.lower().endswith((".cmd", ".bat")): cmd = ["cmd", "/c"] + cmd
        full = ("مجلد المشروع: %s\nمجلد الاستوديو (hs.py): %s\nمجلد المحرّك: %s\nمفسّر بايثون: %s\n\nالمطلوب:\n%s\n" % (work, HERE, eng, PY, task))
        AG.update(running=True, started=time.time()); say(work, label, "ask")
        def go():
            try:
                kw = {"creationflags": 0x08000000} if os.name == "nt" else {}
                p = subprocess.Popen(cmd, cwd=work, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, **kw); AG["proc"] = p
                p.stdin.write(full.encode("utf-8")); p.stdin.close(); final = None
                for raw in p.stdout:
                    try: ev = json.loads(raw.decode("utf-8", "replace"))
                    except Exception: continue
                    if ev.get("type") == "assistant":
                        for b in (ev.get("message") or {}).get("content") or []:
                            if b.get("type") == "text" and b.get("text", "").strip(): say(work, b["text"].strip(), "claude")
                            elif b.get("type") == "tool_use":
                                i = b.get("input") or {}; d = i.get("description") or i.get("command") or i.get("file_path") or i.get("pattern") or ""
                                say(work, "%s: %s" % (b.get("name"), str(d)[:160]), "tool")
                    elif ev.get("type") == "result": final = ev
                p.wait()
                if final and final.get("is_error"): say(work, "Claude وقف بخطأ: " + str(final.get("result", ""))[:300], "err")
                elif p.returncode not in (0, None) and not final: say(work, "Claude ما اشتغل (رمز %s). تأكد إنك مسجّل دخول في Claude Code." % p.returncode, "err")
                else: say(work, "خلص Claude من الطلب.", "done")
            except Exception as e: say(work, "تعذّر تشغيل Claude: " + str(e)[:200], "err")
            finally: AG.update(running=False, proc=None)
        threading.Thread(target=go, daemon=True).start(); return True, ""

    class HS(base.H):
        def _local(self): return self.client_address[0] in ("127.0.0.1", "::1", "localhost")
        def _q(self): return urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        def _role(self):
            if self._local(): return "owner"
            # حماية الرمز على الشبكة: 10 محاولات خاطئة من نفس الجهاز = قفل 15 دقيقة، و200 بالمجموع = قفل الشبكة لين يعاد التشغيل
            ip = self.client_address[0]; now = time.time(); f = FAILS.get(ip)
            if f and now - f[1] > 900: FAILS.pop(ip, None); f = None
            if FAILS_ALL[0] >= 200 or (f and f[0] >= 10): return None
            ck = self.headers.get("Cookie") or ""; q = self._q()
            if ("hs_k=" + TOKEN) in ck or (q.get("k") or [""])[0] == TOKEN: return "owner"
            if ("hs_r=" + RTOKEN) in ck or (q.get("r") or [""])[0] == RTOKEN: return "review"
            if q.get("k") or q.get("r") or "hs_k=" in ck or "hs_r=" in ck:
                FAILS[ip] = [(f[0] if f else 0) + 1, f[1] if f else now]; FAILS_ALL[0] += 1
                if FAILS_ALL[0] == 200: print("تنبيه: محاولات دخول خاطئة كثيرة من الشبكة، قفلت الدخول من الجوال لين تعيد تشغيل الاستوديو"); sys.stdout.flush()
            return None
        protocol_version = "HTTP/1.1"      # اتصال واحد يخدم طلبات كثيرة: بدونه التشغيل (30 فريم بالثانية) يستهلك منافذ ويندوز والاستوديو يعلّق بعد دقايق
        timeout = 75
        def end_headers(self):
            buf = b"".join(getattr(self, "_headers_buffer", [])).lower()
            if b"content-length:" not in buf and not buf.startswith(b"http/1.1 304") and not buf.startswith(b"http/1.1 204"): self.send_header("Connection", "close"); self.close_connection = True
            if b"cache-control:" not in buf: self.send_header("Cache-Control", "max-age=86400, immutable" if getattr(self, "_cache", False) else "no-store")
            self.send_header("Accept-Ranges", "bytes"); http.server.SimpleHTTPRequestHandler.end_headers(self)
        def _file(self, path, ctype, dl=None):
            b = open(path, "rb").read(); self.send_response(200); self.send_header("Content-Type", ctype)
            if dl: self.send_header("Content-Disposition", 'attachment; filename="%s"' % dl)
            self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
        def _deny(self):
            b = ('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body dir=rtl style="font-family:system-ui;background:#101014;color:#eee;display:grid;place-items:center;height:100vh;margin:0">'
                 '<form method=get style="text-align:center"><p>اكتب رمز الدخول الظاهر على شاشة الاستوديو</p><input name=k inputmode=numeric autofocus style="font-size:28px;width:180px;text-align:center;padding:10px;border-radius:10px;border:1px solid #444;background:#1b1b22;color:#fff"><p><button style="font-size:18px;padding:10px 26px;border-radius:10px;border:0;background:#7c5cff;color:#fff">دخول</button></form>').encode()
            self.send_response(403); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
        def _review_video(self):
            ex = exports(); return ("/hs/export/" + ex[0]) if ex else ("/ad-master.mp4" if os.path.exists(P("ad-master.mp4")) else None)
        def do_GET(self):
            u = urllib.parse.urlparse(self.path); p = u.path; q = self._q(); role = self._role()
            self._cache = bool(q.get("v")) and (p.startswith("/vfr/") or p.startswith("/hs/th/") or p.startswith("/hs/pv/") or p.startswith("/bt/"))
            if not role: return self._deny()
            ck = self.headers.get("Cookie") or ""
            for key, val, name in (("k", TOKEN, "hs_k"), ("r", RTOKEN, "hs_r")):
                if (q.get(key) or [""])[0] == val and not self._local() and (name + "=" + val) not in ck:
                    self.send_response(302); self.send_header("Set-Cookie", "%s=%s; Path=/; Max-Age=2592000; SameSite=Lax" % (name, val))
                    self.send_header("Location", p or "/"); self.send_header("Content-Length", "0"); self.end_headers(); return
            # ── صفحة المراجعة (العميل): صلاحيات محدودة ──
            if p == "/hs/ui-font.otf":
                f = os.path.join(HERE, "fonts", "nt-panorama-naskh-long.otf")
                if not os.path.isfile(f): return self.send_error(404)
                b = open(f, "rb").read(); self.send_response(200); self.send_header("Content-Type", "font/otf"); self.send_header("Cache-Control", "max-age=86400"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
            if p == "/review": return self._file(os.path.join(HERE, "review.html"), "text/html; charset=utf-8")
            if p == "/hs/review_state": return self._json(200, {**review(), "video": self._review_video(), "name": os.path.basename(work.rstrip("/\\")), "owner": role == "owner"})
            if p.startswith("/hs/export/"):
                f = os.path.join(D, "exports", os.path.basename(p))
                if not os.path.isfile(f): return self.send_error(404)
                self.path = "/.hs/exports/" + os.path.basename(p); return self._ranged() if self._wants_range() else self._file(f, "video/mp4")
            if role == "review":
                if p == "/ad-master.mp4" and os.path.exists(P("ad-master.mp4")): return self._ranged() if self._wants_range() else self._file(P("ad-master.mp4"), "video/mp4")
                return self._deny()
            # ── المالك ──
            if p in ("/", "/hs", "/hs/"): return self._file(os.path.join(HERE, "studio.html"), "text/html; charset=utf-8")
            if p in ("/m", "/m/"):
                b = open(os.path.join(HERE, "studio.html"), encoding="utf-8").read().replace("<body>", '<body class="m">', 1).encode("utf-8")
                self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(b); return
            if p in ("/hs/qr.js", "/hs/app.js", "/hs/i18n.js"): return self._file(os.path.join(HERE, os.path.basename(p)), "application/javascript; charset=utf-8")
            if p == "/hs/pulse":
                housekeeping(); since = int((q.get("since") or ["0"])[0])
                return self._json(200, {"sig": signature(work), "ready": ready(work), "brief": brief_state(work), "genPending": sum(1 for r in gen_list(work) if r["status"] != "done"), "stages": stages(work), "act": activity(work, since), "preview": latest_preview(), "vis": {"busy": VIS["busy"], "what": VIS["what"]}, "aux": aux_sig(),
                                        "job": {"running": base.JOB["running"], "kind": base.JOB["kind"], "outs": base.JOB.get("outs"), "err": base.JOB["err"]}, "agent": {"running": AG["running"], "elapsed": int(time.time() - AG["started"]) if AG["running"] else 0}})
            if p == "/hs/info":
                return self._json(200, {"version": VERSION, "vsig": vsig(work), "token": TOKEN, "lan": "http://%s:%d/?k=%s" % (LAN, port, TOKEN), "lanM": "http://%s:%d/m?k=%s" % (LAN, port, TOKEN), "review": "http://%s:%d/review?r=%s" % (LAN, port, RTOKEN),
                                        "work": work, "name": os.path.basename(work.rstrip("/\\")), "thumbsDone": BG["thumbsDone"], "versions": versions(), "exports": exports(),
                                        "brands": sorted(os.path.splitext(f)[0] for f in os.listdir(brand_dir())), "local": self._local(), "claude": bool(shutil.which("claude")), "gen": gen_view(gen_list(work)), "safe": safe_of((load_studio(work).get("hs") or {}).get("platforms"), *frame_of(load_studio(work).get("hs") or {})), "platforms": {k: {"safe": v["safe"], "frames": v["frames"], "best": v["best"], "max": v["max"]} for k, v in PLATFORMS.items()},
                                        "assets": sorted(f for f in os.listdir(P("assets")) if os.path.splitext(f)[1].lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")) if os.path.isdir(P("assets")) else [], "seams": keep_seams(work), "looks": looks_all(), "beats": rj(P("beats.json")),
                                        "post": open(P("post.txt"), encoding="utf-8").read() if os.path.exists(P("post.txt")) else "", "ready": ready(work),
                                        "finals": [f for f in sorted(os.listdir(work)) if re.match(r"ad-(master|clean|hook-\d+|\d+x\d+)\.mp4$", f)]})
            if p == "/hs/peaks": return self._json(200, peaks())
            if p == "/hs/notes": return self._json(200, rj(P("notes.json"), []) or [])
            if p == "/hs/check": return self._json(200, check(work))
            if p == "/hs/brief":
                caps = rj(P("caps.json"), {"cards": []}) or {"cards": []}; ck = check(work) if caps.get("cards") else {"fillers": [], "dupes": []}
                return self._json(200, {"ask": rj(brief_paths(work)[0], {}), "answers": rj(brief_paths(work)[1]), "last": rj(os.path.join(HOME_CFG, "last-brief.json")), "state": brief_state(work),
                                        "cards": [card_key(c) for c in caps["cards"]], "fillers": len(ck["fillers"]), "dupes": [[d["a"], d["b"]] for d in ck["dupes"]],
                                        "brands": sorted(os.path.splitext(f)[0] for f in os.listdir(brand_dir())), "name": os.path.basename(work.rstrip("/\\")), "platforms": {k: {"frames": v["frames"]} for k, v in PLATFORMS.items()}})
            if p == "/hs/media_search":
                try: return self._json(200, {"ok": True, "items": (video_search if (q.get("kind") or [""])[0] == "video" else media_search)(work, (q.get("q") or [""])[0], 12)})
                except Exception as e: return self._json(200, {"ok": False, "msg": "البحث فشل (تأكد من النت): " + str(e)[:160], "items": []})
            if p == "/hs/pack.zip" and os.path.exists(os.path.join(D, "pack.zip")): return self._file(os.path.join(D, "pack.zip"), "application/zip", dl=os.path.basename(work.rstrip("/\\")) + "-publish.zip")
            if p.startswith("/sfx_prev/"):
                k = os.path.splitext(os.path.basename(p))[0]
                if sfx_have(k): return self._file(sfx_path(k), "audio/wav")
            if p == "/hs/sfxlib": return self._json(200, {"items": sfx_all(), "myDir": my_dir()})
            if p == "/hs/au.m4a":
                f = audio_file()
                if not f: return self.send_error(404)
                self.path = "/.hs/" + os.path.basename(f); return self._ranged() if self._wants_range() else self._file(f, "audio/mp4")
            if p == "/hs/tools":
                tl = []
                for name, why, src, okf in TOOLS:
                    try: g = bool(okf())
                    except Exception: g = False
                    tl.append({"name": name, "why": why, "src": src, "ok": g})
                return self._json(200, {"tools": tl, "net": NET_USE})
            if p.startswith("/hs/pv/"):       # فريم معاينة مصغّر (540 عرض): أخف 4 مرات من الأصلي، والتصدير ما يستخدمه
                n = max(1, int(re.sub(r"\D", "", p) or 1)); src = P("vfr", "%05d.jpg" % n); f = os.path.join(D, "pv", "%05d.jpg" % n)
                if not os.path.exists(src): return self.send_error(404)
                try: fresh = os.path.getmtime(f) >= os.path.getmtime(src)
                except OSError: fresh = False
                if not fresh: pv_build(work)
                return self._file(f if fresh else src, "image/jpeg")
            if p.startswith("/hs/th/"):
                n = int(re.sub(r"\D", "", p) or 1); f = os.path.join(D, "th", "%04d.jpg" % max(1, n))
                if not os.path.exists(f): f = P("vfr", "%05d.jpg" % max(1, (n - 1) * 30 + 1))
                return self._file(f, "image/jpeg") if os.path.exists(f) else self.send_error(404)
            if p.startswith("/hs/brand/"):
                b = rj(os.path.join(brand_dir(), os.path.basename(urllib.parse.unquote(p)) + ".json")); return self._json(200 if b else 404, b or {})
            if p.startswith("/.hs/") or p.startswith("/.studio_bak"): return self.send_error(404)
            self.path = p + (("?" + u.query) if u.query and "k=" not in u.query else "")
            return super().do_GET()
        def do_POST(self):
            role = self._role()
            if not role: return self._deny()
            p = urllib.parse.urlparse(self.path).path
            if role == "review" and p not in ("/hs/review_comment", "/hs/review_approve"): return self._deny()
            if not (p.startswith("/hs/") or p.startswith("/api/recut") or p.startswith("/api/drop") or p.startswith("/api/undo_cut") or p.startswith("/api/render")):
                return super().do_POST()
            n = int(self.headers.get("Content-Length") or 0); raw = self.rfile.read(n)
            try:
                if p == "/hs/gen_import":
                    name = os.path.basename(urllib.parse.unquote(self.headers.get("X-Name") or "file")); ext = os.path.splitext(name)[1].lower()
                    if ext not in IMG_EXT + VID_EXT: return self._json(400, {"ok": False, "msg": "ارفع صورة png/jpg/webp أو مقطع mp4/mov/webm"})
                    if n > 300 * 1024 * 1024: return self._json(400, {"ok": False, "msg": "الملف أكبر من 300 ميقا"})
                    os.makedirs(D, exist_ok=True); tmp = os.path.join(D, "up" + ext); open(tmp, "wb").write(raw); at = self.headers.get("X-At")
                    res = gen_import(work, self.headers.get("X-Id") or "-", tmp, name=name, at=(float(at) if at else None), fit=self.headers.get("X-Fit") or None, log=base.log)
                    try: os.remove(tmp)
                    except OSError: pass
                    return self._json(200, {"ok": True, **res, "gen": gen_view(gen_list(work))})
                if p == "/hs/mysfx":
                    name = os.path.basename(urllib.parse.unquote(self.headers.get("X-Name") or "sound.mp3"))
                    if not name.lower().endswith(AUD_EXT): return self._json(400, {"ok": False, "msg": "ارفع ملف صوت (mp3 · wav · m4a …)"})
                    if n > 60 * 1024 * 1024: return self._json(400, {"ok": False, "msg": "الملف أكبر من 60 ميقا"})
                    safe = re.sub(r"[^\w.\- ]+", "_", name); open(os.path.join(my_dir(), safe), "wb").write(raw); meta = my_list(); m = next((x for x in meta if x.get("file") == safe), None)
                    if not m:
                        try: os.remove(os.path.join(my_dir(), safe))
                        except OSError: pass
                        return self._json(400, {"ok": False, "msg": "ما قدرت أقرأ الملف كصوت"})
                    return self._json(200, {"ok": True, "id": m["id"], "items": sfx_all()})
                if p in ("/hs/font", "/hs/asset"):
                    name = os.path.basename(urllib.parse.unquote(self.headers.get("X-Name") or "file"))
                    pat = r"\.(ttf|otf|woff2?)$" if p == "/hs/font" else r"\.(png|jpe?g|webp|gif|svg)$"
                    if not re.search(pat, name, re.I): return self._json(400, {"ok": False, "msg": "صيغة الملف غير مدعومة"})
                    if n > 40 * 1024 * 1024: return self._json(400, {"ok": False, "msg": "الملف أكبر من 40 ميقا"})
                    safe = re.sub(r"[^\w.\- ]+", "_", name); folder = "fonts" if p == "/hs/font" else "assets"; os.makedirs(P(folder), exist_ok=True); open(P(folder, safe), "wb").write(raw)
                    return self._json(200, {"ok": True, "name": os.path.splitext(safe)[0], "file": safe, "src": folder + "/" + safe})
                data = json.loads(raw or b"{}")
                # ── العميل ──
                if p == "/hs/review_comment":
                    rv = review(); cid = max([c["id"] for c in rv["comments"]] or [0]) + 1
                    rv["comments"].append({"id": cid, "t": round(float(data.get("t", 0)), 2), "who": str(data.get("who") or "عميل")[:40], "text": str(data.get("text", ""))[:800],
                                           "draw": (data.get("draw") or [])[:40], "at": time.strftime("%Y-%m-%d %H:%M"), "status": "open"})
                    wj(P("review.json"), rv); return self._json(200, {"ok": True, **rv})
                if p == "/hs/review_approve":
                    rv = review(); rv["approved"] = {"by": str(data.get("who") or "عميل")[:40], "at": time.strftime("%Y-%m-%d %H:%M")} if data.get("ok", True) else None
                    wj(P("review.json"), rv); say(work, "العميل %s اعتمد المقطع" % rv["approved"]["by"] if rv["approved"] else "انسحب الاعتماد", "info"); return self._json(200, {"ok": True, **rv})
                # ── المالك ──
                if p == "/hs/review_promote":
                    rv = review(); c = next((x for x in rv["comments"] if x["id"] == int(data["id"])), None)
                    if not c: return self._json(404, {"ok": False})
                    notes = rj(P("notes.json"), []) or []; nid = max([int(x["id"]) for x in notes] or [0]) + 1
                    notes.append({"id": nid, "t": c["t"], "card": None, "text": c["text"], "pin": None, "status": "open", "who": c["who"], "at": time.strftime("%Y-%m-%d %H:%M")})
                    c["status"] = "promoted"; wj(P("notes.json"), notes); wj(P("review.json"), rv); return self._json(200, {"ok": True, "notes": notes, **rv})
                if p.startswith("/api/recut") or p.startswith("/api/drop") or p.startswith("/api/undo_cut"):
                    return self._json(410, {"ok": False, "msg": "استخدم /hs/remove"})
                if p == "/hs/mysfx_edit":
                    my_edit(str(data.get("id") or ""), data.get("name"), data.get("note"), bool(data.get("delete"))); return self._json(200, {"ok": True, "items": sfx_all()})
                if p == "/hs/open_sounds":
                    if not self._local(): return self._json(200, {"ok": False, "msg": "يفتح من الجهاز نفسه فقط", "dir": my_dir()})
                    try:
                        if os.name == "nt": os.startfile(my_dir())
                        else: subprocess.Popen(["open" if sys.platform == "darwin" else "xdg-open", my_dir()])
                    except Exception: pass
                    return self._json(200, {"ok": True, "dir": my_dir()})
                if p == "/hs/sfx_fetch":
                    d = json.loads(raw or b"{}"); ok, bad = sfx_fetch(d.get("ids") or None)
                    return self._json(200, {"ok": not bad, "got": ok, "bad": bad, "msg": ("ما قدرت أنزّل %d صوت. تأكد من النت." % len(bad)) if bad else ""})
                if p == "/hs/remove":
                    def go(): remove_ranges(work, S, base.log, ranges=data.get("ranges") or [], cards=data.get("cards") or [], words=data.get("words") or []); base.JOB["reload"] = True
                    ok = base.job("remove", go); return self._json(200 if ok else 409, {"ok": ok, "msg": "" if ok else "فيه عملية شغالة"})
                if p.startswith("/api/render") or p == "/hs/export":
                    kind = data.get("kind", "final"); hooks = bool(data.get("hooks")); frm = data.get("frame")
                    def go(): outs = export(work, S, base.log, kind=kind, hooks=hooks, frame=frm); base.JOB["done"] = outs[0]; base.JOB["outs"] = outs
                    ok = base.job("render", go); return self._json(200 if ok else 409, {"ok": ok, "msg": "" if ok else "فيه عملية شغالة"})
                if p == "/hs/pack": return self._json(200, {"ok": True, "files": pack(work), "zip": "/hs/pack.zip"})
                if p == "/hs/brief_save":
                    ans = data.get("answers") or {}; ans["savedAt"] = int(time.time()); wj(brief_paths(work)[1], ans)
                    try: os.makedirs(HOME_CFG, exist_ok=True); wj(os.path.join(HOME_CFG, "last-brief.json"), {k: v for k, v in ans.items() if k not in ("cut", "hook", "notes", "ref", "extra", "savedAt")})
                    except Exception: pass
                    say(work, "حفظ إجاباته. Claude يبدأ المونتاج.", "done"); return self._json(200, {"ok": True})
                if p == "/hs/media_add":
                    if (data.get("item") or {}).get("kind") == "video":
                        key, n = video_add(work, data["item"], data.get("at"), data.get("dur", 4)); return self._json(200, {"ok": True, "clip": key, "frames": n})
                    lid, name = media_add(work, data["item"], data.get("at"), data.get("dur", 3), data.get("fit", "card")); return self._json(200, {"ok": True, "id": lid, "file": name})
                if p == "/hs/shot":
                    lid, name = shot_add(work, str(data.get("url", "")).strip(), data.get("at"), data.get("dur", 4), log=lambda *_: None); return self._json(200, {"ok": True, "id": lid, "file": name})
                if p == "/hs/auto": return self._json(200, {"ok": True, "n": auto_layers(work, data["kind"], bool(data.get("on", True)))})
                if p == "/hs/gen":
                    kind = data.get("kind"); prompt = str(data.get("prompt", "")).strip()
                    if not prompt: return self._json(400, {"ok": False, "msg": "اكتب وصف المطلوب"})
                    rid = gen_request(work, kind, prompt, data.get("at"), data.get("fit", "card")); q = gen_list(work)
                    return self._json(200, {"ok": True, "id": rid, "gen": gen_view(q)})
                if p == "/hs/gen_rm": return self._json(200, {"ok": True, "gen": gen_view(gen_rm(work, data.get("id")))})
                if p == "/hs/frame":
                    st = load_studio(work); h = hs_of(st); f = h.setdefault("frame", {})
                    if data.get("ar") in FRAMES: f["ar"] = data["ar"]
                    if data.get("cy") is not None: f["cy"] = max(0.2, min(0.8, float(data["cy"])))
                    if isinstance(data.get("platforms"), list): h["platforms"] = [x for x in data["platforms"] if x in PLATFORMS]
                    wj(P("studio.json"), st); return self._json(200, {"ok": True, "safe": safe_of(h.get("platforms"), *frame_of(h))})
                if p == "/hs/post": open(P("post.txt"), "w", encoding="utf-8").write(str(data.get("text", ""))); return self._json(200, {"ok": True})
                if p == "/hs/text":
                    caps, hs = apply_text(work, int(data["card"]), data["text"]); return self._json(200, {"ok": True, "caps": caps, "hs": hs})
                if p == "/hs/note":
                    notes = rj(P("notes.json"), []) or []; nid = (max([int(x["id"]) for x in notes] or [0]) + 1)
                    note = {"id": nid, "t": round(float(data.get("t", 0)), 2), "card": data.get("card"), "text": str(data.get("text", ""))[:1000],
                            "pin": data.get("pin"), "status": "open", "who": str(data.get("who") or ("أنا" if self._local() else "جوال"))[:30], "at": time.strftime("%Y-%m-%d %H:%M")}
                    img = data.get("img") or ""
                    if img.startswith("data:image/jpeg;base64,"):
                        os.makedirs(P("notes"), exist_ok=True); open(P("notes", "%d.jpg" % nid), "wb").write(base64.b64decode(img.split(",", 1)[1])); note["img"] = "notes/%d.jpg" % nid
                    notes.append(note); wj(P("notes.json"), notes); return self._json(200, {"ok": True, "notes": notes})
                if p == "/hs/note_edit":
                    notes = rj(P("notes.json"), []) or []
                    for x in notes:
                        if str(x["id"]) == str(data["id"]):
                            if "text" in data: x["text"] = str(data["text"])[:1000]
                            if "status" in data: x["status"] = data["status"]
                    if data.get("delete"): notes = [x for x in notes if str(x["id"]) != str(data["id"])]
                    wj(P("notes.json"), notes); return self._json(200, {"ok": True, "notes": notes})
                if p == "/hs/notes_send":
                    notes = rj(P("notes.json"), []) or []; caps = rj(P("caps.json"), {"cards": []})
                    open(P("NOTES.md"), "w", encoding="utf-8").write(notes_md(notes, caps))
                    for x in notes:
                        if x.get("status") == "open": x["status"] = "sent"
                    wj(P("notes.json"), notes); cnt = sum(1 for x in notes if x.get("status") == "sent"); started = False; msg = ""
                    if data.get("run"):
                        started, msg = agent_run("طبّق ملاحظات الاستوديو المفتوحة على هذا المشروع (python hs.py notes <work> list)، وعلّم كل ملاحظة تنفّذها بـ done مع جملة وش سويت. الملاحظة اللي مو واضحة خلّها مفتوحة واذكرها بآخر ردّك.", "طلب: طبّق %d ملاحظة" % cnt)
                    return self._json(200, {"ok": True, "notes": notes, "count": cnt, "started": started, "msg": msg, "prompt": "طبّق ملاحظات الاستوديو على المشروع: " + work})
                if p == "/hs/agent":
                    task = str(data.get("task", "")).strip()
                    if not task: return self._json(400, {"ok": False, "msg": "اكتب الطلب"})
                    ctx = "\n\n(سياق من الاستوديو: المؤشر عند %.2f ث%s)" % (float(data.get("t", 0)), ("، المحدد: " + str(data.get("sel"))) if data.get("sel") else "")
                    ok, msg = agent_run(task + ctx, "طلب: " + task[:140], gen=bool(data.get("gen"))); return self._json(200 if ok else 409, {"ok": ok, "msg": msg, "prompt": task + " — المشروع: " + work})
                if p == "/hs/agent_stop":
                    pr = AG.get("proc")
                    if pr:
                        try: pr.kill()
                        except Exception: pass
                    return self._json(200, {"ok": True})
                if p == "/hs/ver_save": return self._json(200, {"ok": True, "id": snapshot(work, data.get("name")), "versions": versions()})
                if p == "/hs/ver_restore":
                    need = ver_restore(data["id"])
                    if need:
                        def go(): rebuild_video(work, S, base.log); base.JOB["reload"] = True
                        base.job("remove", go)
                    return self._json(200, {"ok": True, "versions": versions(), "rebuild": need})
                if p == "/hs/brand_save":
                    name = re.sub(r"[^\w\- ]+", "", str(data.get("name", ""))).strip()[:40]
                    if not name: return self._json(400, {"ok": False, "msg": "اكتب اسم الهوية"})
                    wj(os.path.join(brand_dir(), name + ".json"), brand_pack(work)); return self._json(200, {"ok": True, "brands": sorted(os.path.splitext(f)[0] for f in os.listdir(brand_dir()))})
                return self._json(404, {"ok": False})
            except Exception as e:
                return self._json(500, {"ok": False, "msg": str(e)[:300]})

    import http.server
    srv = http.server.ThreadingHTTPServer(("0.0.0.0", port), HS)
    local = "http://127.0.0.1:%d/" % port; lan = "http://%s:%d/m?k=%s" % (LAN, port, TOKEN)
    open(os.path.join(D, "url.txt"), "w").write(local + "\n" + lan + "\n")
    print("Hojas Studio %s شغّال" % VERSION); print("  على الجهاز : " + local)
    print("  على الجوال : " + lan + "   (نفس الواي فاي · رمز الدخول %s)" % TOKEN); print("  المحرّك    : " + eng); sys.stdout.flush()
    try: srv.serve_forever()
    except KeyboardInterrupt: pass

def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"): print(__doc__); return
    def opt(name, default=None):
        if name in a:
            i = a.index(name); v = a[i + 1]; del a[i:i + 2]; return v
        return default
    def flag(name):
        if name in a: a.remove(name); return True
        return False
    def multi(name):
        if name not in a: return []
        i = a.index(name); j = i + 1
        while j < len(a) and not a[j].startswith("--"): j += 1
        v = a[i + 1:j]; del a[i:j]; return v
    engine = opt("--engine"); port = int(opt("--port", "8800")); cmd = a[0]
    if cmd == "doctor": sys.exit(0 if cmd_doctor(engine) else 1)
    if cmd == "platform": return cmd_platform(a[1:])
    if cmd == "tools": print(tools_text()); return
    if cmd == "selftest": sys.exit(0 if cmd_selftest(os.path.abspath(a[1]) if len(a) > 1 else None, engine) else 1)
    if len(a) < 2: sys.exit("لازم مجلد الشغل: python hs.py %s <work>" % cmd)
    work = os.path.abspath(a[1])
    if cmd == "open": return cmd_open(work, port, engine, browser=not flag("--no-browser"))
    if cmd == "serve": return serve(work, port, engine)
    if not os.path.isdir(work): sys.exit("ما لقيت مجلد الشغل: " + work)
    if cmd == "say": kind = opt("--kind", "step"); say(work, " ".join(a[2:]), kind); return
    if cmd in ("remove", "export"):
        eng = find_engine(engine) or sys.exit("ما لقيت المحرّك — مرّر --engine"); S = os.path.join(eng, "scripts"); fix_windows_path(); log = lambda s: print(s, flush=True)
        if cmd == "remove":
            cards = [int(x) - 1 for x in multi("--cards")]; rngs = [[float(y) for y in x.split("-")] for x in multi("--ranges")]
            words = [(f["card"], f["idx"]) for f in check(work)["fillers"]] if flag("--fillers") else []
            print(json.dumps(remove_ranges(work, S, log, ranges=rngs, cards=cards, words=words), ensure_ascii=False))
        else: print("الملفات:", ", ".join(export(work, S, log, kind="clean" if flag("--clean") else "final", hooks=flag("--hooks"), frame=opt("--frame"))))
        return
    rest = a[2:]
    if cmd == "patch": r = patch(work); print("انركّبت الإضافة" if r else "الإضافة مركّبة من قبل (حدّثت نسختها)")
    elif cmd == "notes": cmd_notes(work, rest)
    elif cmd == "tr": cmd_tr(work, rest)
    elif cmd == "text": cmd_text(work, rest)
    elif cmd == "set": cmd_set(work, rest)
    elif cmd == "layer": cmd_layer(work, rest)
    elif cmd == "hook": cmd_hook(work, rest)
    elif cmd == "check": cmd_check(work)
    elif cmd == "brief": cmd_brief(work, rest)
    elif cmd == "media": cmd_media(work, rest)
    elif cmd == "sfx": cmd_sfx(work, rest)
    elif cmd == "face":
        try: os.remove(J(work, "face.json"))
        except OSError: pass
        vision_run(work, ["face"], print)
    elif cmd == "mask": vision_run(work, ["mask"] + (rest or mask_need(work) or ["all"]), print)
    elif cmd == "shot":
        if not rest: sys.exit('shot <work> <url> [--at <ث>] [--dur 4] [--top]   (--top = أول شاشة فقط بدل الصفحة كاملة)')
        def _o(nm, d=None):
            if nm in rest: i = rest.index(nm); x = rest[i + 1]; del rest[i:i + 2]; return x
            return d
        at = _o("--at", 0); dur = _o("--dur", 4); top = "--top" in rest
        if top: rest.remove("--top")
        lid, name = shot_add(work, rest[0], float(at), float(dur), not top); print("انضافت لقطة الموقع %s كطبقة %s بإطار متصفح عند %s ث" % (name, lid, at))
    elif cmd == "gen": cmd_gen(work, rest)
    elif cmd == "auto": cmd_auto(work, rest)
    elif cmd == "caps": cmd_caps(work, rest)
    elif cmd == "look": cmd_look(work, rest)
    elif cmd == "beat": cmd_beat(work, rest)
    elif cmd == "pack": print("\n".join(pack(work))); print("→ " + J(work, ".hs", "pack.zip"))
    elif cmd == "brand": cmd_brand(work, rest)
    elif cmd == "status": cmd_status(work)
    else: sys.exit("أمر غير معروف: " + cmd)

if __name__ == "__main__": main()
