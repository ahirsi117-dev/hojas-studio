# -*- coding: utf-8 -*-
"""يبني توقيتات الكابشن على التايم-لاين الجديد.  python3 02_captions.py <workdir>
يقرأ: cut.json · a.json (وِسبر) · fixes.json  ← {"fix":[[كلمات الجملة 0],...], "hot":[كلمات تُظلَّل]}
عدد كلمات كل جملة في fix لازم يساوي عدد كلمات وِسبر لنفس الجملة (عشان التوقيتات تبقى مضبوطة)."""
# ── توافق ويندوز/UTF-8 (مضاف) ─────────────────────────────────────
import sys as _sys, builtins as _bi
try:
    _sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    _sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
_real_open = _bi.open
def _utf8_open(f, mode="r", *a, **k):
    if "b" not in mode:
        k.setdefault("encoding", "utf-8")
    return _real_open(f, mode, *a, **k)
_bi.open = _utf8_open
# ──────────────────────────────────────────────────────────────────
import json, sys, os
W=os.path.abspath(sys.argv[1])
keep=json.load(open(os.path.join(W,"cut.json")))["keep"]
# 4.7.1: نفس تقريب الفريمات اللي يسويه 03_cut_zoom.py، عشان توقيت الكابشن يطابق الفيديو بالضبط
import subprocess
from fractions import Fraction as _Fr
def _fps():
    try:
        r=subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=r_frame_rate","-of","csv=p=0",os.path.join(W,"src.mov")],capture_output=True,text=True).stdout.strip().split("\n")[0]
        f=_Fr(r); return f if 10<=f<=121 else _Fr(30)
    except Exception: return _Fr(30)
_F=_fps()
def _snap(t): return float(round(_Fr(t).limit_denominator(100000)*_F)/_F)
keep=[[_snap(a),_snap(b)] for a,b in keep]; keep=[x for x in keep if x[1]-x[0]>=1.0/float(_F)]
tr=json.load(open(os.path.join(W,"a.json")))

# 4.7.1: توقيت الكلمات من وِسبر يتأخر أحياناً نص ثانية أو أكثر، ويبلع السكتات داخل الكلمة.
# نضبط بداية ونهاية كل كلمة على الصوت نفسه: البداية على أول صوت فعلي، والنهاية قبل السكتة اللي بعدها.
def refine_words(segments):
    try:
        import numpy as np
    except Exception: return 0
    src = os.path.join(W, "a.wav") if os.path.isfile(os.path.join(W, "a.wav")) else os.path.join(W, "src.mov")
    try:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-af", "highpass=f=90", "-f", "s16le", "-"], capture_output=True).stdout
    except Exception: return 0
    x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0; n = len(x) // 160
    if n < 50: return 0
    db = np.convolve(20 * np.log10(np.sqrt(np.mean(x[:n * 160].reshape(n, 160) ** 2, axis=1)) + 1e-9), np.ones(3) / 3, mode="same")
    thr = min(max(float(np.percentile(db, 10)) + 10.0, -52.0), float(np.percentile(db, 95)) - 12.0); v = db > thr
    i = 0
    while i < n:                       # نسد الفراغات الصغيرة ونشيل النقرات
        if not v[i]:
            j = i
            while j < n and not v[j]: j += 1
            if j - i < 8 and i > 0 and j < n: v[i:j] = True
            i = j
        else: i += 1
    i = 0
    while i < n:
        if v[i]:
            j = i
            while j < n and v[j]: j += 1
            if j - i < 6: v[i:j] = False
            i = j
        else: i += 1
    WS = [w for sg in segments for w in sg.get("words", [])]; prev = 0; moved = 0
    for k, w in enumerate(WS):
        S = max(prev, int(round(w["start"] * 100))); E = max(S + 8, int(round(w["end"] * 100)))
        nxt = int(round(WS[k + 1]["start"] * 100)) if k + 1 < len(WS) else n
        S0 = S
        if S < n and not v[S]:                       # البداية على سكتة: نقدّمها لأول صوت داخل الكلمة
            j = S
            while j < min(E - 6, n) and not v[j]: j += 1
            if j < min(E - 6, n): S = j
        elif S < n:                                   # الصوت بدأ قبل وِسبر بعد سكتة: نرجّع البداية له
            j = S
            while j - 1 >= prev and j - 1 >= S - 80 and v[j - 1]: j -= 1
            if j > prev and j < S and not v[j - 1]: S = j
        if E - 1 < n and not v[min(E - 1, n - 1)]:   # آخر الكلمة سكتة: نقصّرها لآخر صوت
            j = min(E - 1, n - 1)
            while j > S + 8 and not v[j]: j -= 1
            E = min(E, j + 6)
        E = max(E, S + 8); E = min(E, max(S + 8, nxt)) if nxt > S else E
        if abs(S - S0) >= 5: moved += 1
        w["start"] = round(S / 100.0, 3); w["end"] = round(E / 100.0, 3); prev = int(round(w["end"] * 100))
    return moved
if os.environ.get("HS_NO_ALIGN") != "1":
    try:
        _mv = refine_words(tr.get("segments", []))
        if _mv: print("ضبطت توقيت %d كلمة على الصوت" % _mv)
    except Exception as _e: print("ضبط التوقيت ما اشتغل:", str(_e)[:80])
fx=json.load(open(os.path.join(W,"fixes.json")))
FIX, HOT = fx["fix"], set(fx.get("hot",[]))
FXMAP = fx.get("fx", {})   # 🎬 حركات الكلمة العربية (v3.1): {"خلاص":"drop","متصلة":"type",…} — drop · shake · crack · type · pulse · stretch · slam

def seg_of(t):
    best,bd=0,1e9
    for i,(a,b) in enumerate(keep):
        if a<=t<=b: return i
        d=min(abs(t-a),abs(t-b))
        if d<bd: bd,best=d,i
    return best
off=[];acc=0.0
for a,b in keep: off.append(acc); acc+=b-a
def newt(t,si):
    a,b=keep[si]; return off[si]+(max(a,min(b,t))-a)

cards=[]
for i,seg in enumerate(tr["segments"]):
    ws=seg.get("words",[]); f=FIX[i]
    if len(ws)!=len(f):
        sys.exit(f"❌ الجملة {i}: وِسبر {len(ws)} كلمة، fixes.json {len(f)} — لازم يتساوون")
    # 4.7.1: كل كلمة على جزئها هي. قبل كانت الجملة كلها تنحسب على جزء واحد، فلو انقص بنصها سكتة
    # الكلمات اللي بعد القطعة تنضغط على حدّه وتطلع متأخرة أو متكدّسة
    o=[]; sis=[]
    for w,txt in zip(ws,f):
        si=seg_of((w["start"]+w["end"])/2); sis.append(si)
        s,e=newt(w["start"],si),newt(w["end"],si)
        if e<=s: e=s+0.12
        _w={"t":txt,"s":round(s,3),"e":round(e,3),"hot":txt in HOT or txt in FXMAP}
        if txt in FXMAP: _w["fx"]=FXMAP[txt]
        o.append(_w)
    s0,s1=sis[0],sis[-1]; a,b=keep[s1]
    cs=max(o[0]["s"]-0.10, off[s0])
    ce=min(max(x["e"] for x in o)+0.28, off[s1]+(b-a))
    cards.append({"s":round(cs,3),"e":round(ce,3),"w":o})
for i in range(len(cards)-1):
    if cards[i]["e"]>cards[i+1]["s"]: cards[i]["e"]=round(cards[i+1]["s"]-0.02,3)
json.dump({"total":round(acc,3),"cards":cards},open(os.path.join(W,"caps.json"),"w"),ensure_ascii=False,indent=1)
print("كروت:",len(cards)," المدة:",round(acc,2))
for c in cards: print(f"{c['s']:6.2f}-{c['e']:6.2f}  "+" ".join(x['t'] for x in c['w']))
