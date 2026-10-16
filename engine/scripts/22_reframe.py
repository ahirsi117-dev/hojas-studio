# -*- coding: utf-8 -*-
"""4.5: القص العمودي يتبع اللي يتكلم (فيديو عرضي 16:9: بودكاست أو مقابلة).
   python 22_reframe.py <work>   ← يكتب reframe.json:  {"keys": [[ثانية, مركز القص 0..1], ...], "people": n}
   بدون مكتبات: ffmpeg يطلّع فريمات صغيرة رمادية، ونحسب وين الحركة بكل عمود. أماكن الحركة الثابتة = الأشخاص،
   واللي يتحرك أكثر وقت كل جملة = اللي يتكلم. القص ينتقل بين الجمل بس (مثل مونتاج البودكاست)، وما يرجف."""
import sys, os, json, subprocess
W = os.path.abspath(sys.argv[1]); SRC = os.path.join(W, "src.mov")
FPS = 4; GW, GH = 96, 54
def probe(f):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", f], capture_output=True, text=True).stdout
    d = json.loads(o or "{}"); s = (d.get("streams") or [{}])[0]
    return int(s.get("width") or 0), int(s.get("height") or 0), float((d.get("format") or {}).get("duration") or 0)
def main():
    sw, sh, dur = probe(SRC)
    if not sw or sw / max(1, sh) < 0.75: print("الفيديو عمودي، ما يحتاج تتبّع"); return
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-vf", "fps=%d,scale=%d:%d,format=gray" % (FPS, GW, GH), "-f", "rawvideo", "-"], capture_output=True).stdout
    n = len(raw) // (GW * GH)
    if n < 3: print("ما قدرت أقرأ الفريمات"); return
    rows = range(int(GH * 0.08), int(GH * 0.75))   # الوجه والجسم، مو الطاولة تحت
    E = []; prev = None
    for k in range(n):
        f = raw[k * GW * GH:(k + 1) * GW * GH]
        if prev is not None:
            col = [0] * GW
            for y in rows:
                o = y * GW
                for x in range(GW): col[x] += abs(f[o + x] - prev[o + x])
            E.append(col)
        prev = f
    P = [sum(e[x] for e in E) for x in range(GW)]
    S = [sum(P[max(0, x - 3):x + 4]) / len(P[max(0, x - 3):x + 4]) for x in range(GW)]
    mx = max(S) or 1; peaks = []
    for x in range(2, GW - 2):
        if S[x] >= mx * 0.38 and S[x] == max(S[max(0, x - 9):x + 10]) and all(abs(x - p) >= 18 for p in peaks): peaks.append(x)
    peaks = sorted(peaks, key=lambda x: -S[x])[:3]
    if not peaks: peaks = [GW // 2]
    half = sh * 9 / 16 / sw / 2   # نص عرض القص كنسبة من العرض
    clamp = lambda c: max(half, min(1 - half, c))
    def centroid(x0):
        a, b = max(0, x0 - 10), min(GW, x0 + 11); w = sum(S[a:b]) or 1
        return sum(x * S[x] for x in range(a, b)) / w / GW
    centers = [clamp(centroid(p)) for p in peaks]
    keys = []
    if len(peaks) == 1:
        keys = [[0.0, round(centers[0], 4)]]
    else:
        A = json.load(open(os.path.join(W, "a.json"), encoding="utf-8")) if os.path.exists(os.path.join(W, "a.json")) else {}
        segs = [(float(s["start"]), float(s["end"])) for s in A.get("segments") or []] or [(i * 3.0, i * 3.0 + 3) for i in range(int(dur // 3) + 1)]
        cur = None; last_t = -9
        for a, b in segs:
            k0, k1 = max(0, int(a * FPS) - 1), min(len(E), int(b * FPS) + 1)
            if k1 <= k0: continue
            sc = [sum(sum(e[max(0, p - 8):p + 9]) for e in E[k0:k1]) for p in peaks]
            who = sc.index(max(sc))
            if cur is None: cur = who; keys.append([0.0, round(centers[who], 4)]); last_t = 0; continue
            if who != cur and (b - a) >= 1.2 and a - last_t >= 1.5 and max(sc) > 1.25 * sc[cur]:
                cur = who; last_t = a; keys.append([round(max(0, a - 0.1), 3), round(centers[who], 4)])
    json.dump({"v": 1, "keys": keys, "people": len(peaks), "src": [sw, sh]}, open(os.path.join(W, "reframe.json"), "w", encoding="utf-8"))
    print("تتبّع المتكلم: %d شخص · %d انتقال" % (len(peaks), max(0, len(keys) - 1)))
if __name__ == "__main__": main()
