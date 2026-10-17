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
import wave,numpy as np
import sys, os
S=os.path.abspath(sys.argv[1])+"/"
import json
SR=48000
_c=json.load(open(S+"caps.json"))
_s=json.load(open(S+"sfx.json"))
VEND=_c["total"]; OUTRO=_s["outro"]; DUR=VEND+OUTRO
n=int(DUR*SR)+SR
buf=np.zeros(n)
rng=np.random.RandomState(11)
def add(sig,t0,g=1.0):
    i=max(0,int(t0*SR)); j=min(n,i+len(sig)); buf[i:j]+=sig[:j-i]*g
def lp(x,a0,a1):
    y=np.empty_like(x); z=0.0
    for i in range(len(x)):
        a=a0+(a1-a0)*(i/len(x)); z+=a*(x[i]-z); y[i]=z
    return y
def whoosh(dur=0.34,up=True):
    L=int(dur*SR); t=np.arange(L)/SR
    x=rng.randn(L)
    y=lp(x,0.03,0.30) if up else lp(x,0.30,0.03)
    y/= (np.max(np.abs(y))+1e-9)
    env=np.sin(np.pi*np.clip(t/dur,0,1))**1.6
    return y*env
def thud(f0=135,f1=58,dur=0.30):
    L=int(dur*SR); t=np.arange(L)/SR
    f=f0*np.exp(np.log(f1/f0)*t/dur)
    ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t/0.085)
    s+=lp(rng.randn(L),0.35,0.05)*np.exp(-t/0.006)*0.35
    return s/ (np.max(np.abs(s))+1e-9)
def tap(dur=0.09):
    L=int(dur*SR); t=np.arange(L)/SR
    s=lp(rng.randn(L),0.22,0.05)*np.exp(-t/0.013)
    s*=np.minimum(1.0,t/0.0012)
    return s/(np.max(np.abs(s))+1e-9)

W1=whoosh(0.34,True); W2=whoosh(0.30,False); TH=thud(); TP=tap()
def _tg(v): return (float(v[0]), float(v[1]) if len(v)>1 and v[1] is not None else 1.0) if isinstance(v,list) else (float(v),1.0)   # 4.11: الصوت له مستواه من الاستوديو
for v in _s.get("whoosh_up",[]):   t0,g=_tg(v); add(W1,t0,0.085*g)
for v in _s.get("whoosh_down",[]): t0,g=_tg(v); add(W2,t0,0.075*g)
for v in _s.get("thud",[]):        t0,g=_tg(v); add(TH,t0,0.115*g)
for v in _s.get("tap",[]):         t0,g=_tg(v); add(TP,t0,0.075*g)
# ── مكتبة الأصوات (ملفات wav في ~/.hojas-studio/sfx، مفاتيحها تبدأ بـ mk، وأصوات المستخدم تبدأ بـ my) ──
# القيمة: ثانية · أو [ثانية, قوة] · أو [ثانية, قوة, مدة] · أو [ثانية, قوة, مدة, يبدأ من (داخل الصوت), ظهور تدريجي, اختفاء تدريجي] (4.11).
# المدة null = لين آخر الصوت. الصوت ينقص عند نهاية الفيديو بتلاشي.
import subprocess
_LIB=os.environ.get("HS_SFX_DIR") or os.path.join(os.path.expanduser("~"),".hojas-studio","sfx")
def _load(k):
    f=os.path.join(_LIB,k+".wav")
    if not os.path.isfile(f): print("⚠️ صوت ناقص من المكتبة:",k,"— نزّله: hs sfx <work> fetch",k); return None
    try:
        raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar",str(SR),"-f","s16le","-"],capture_output=True).stdout
        x=np.frombuffer(raw,dtype="<i2").astype(np.float64)/32768.0
        return x/(np.max(np.abs(x))+1e-9) if len(x) else None
    except Exception as e: print("⚠️ ما انقرأ الصوت",k,e); return None
# 4.0: الموسيقى الطويلة تنخفض تحت الكلام (من توقيت الكلمات نفسه، بلا تحليل صوت)
_DUCK=float(os.environ.get("HS_DUCK","0.45"))
_sp=np.zeros(n)
for _cd in _c["cards"]:
    for _w in _cd["w"]:
        _a=max(0,int((_w["s"]-0.05)*SR)); _b=min(n,int((_w["e"]+0.12)*SR)); _sp[_a:_b]=1.0
_k=int(0.18*SR); _env=np.convolve(_sp,np.ones(_k)/_k,mode="same") if _k>1 else _sp
_DUCKENV=1.0-(1.0-_DUCK)*np.clip(_env,0,1)
for k,arr in _s.items():
    if not (isinstance(arr,list) and k.startswith(("mk","my","cc-"))): continue
    sig=_load(k)
    if sig is None: continue
    base=0.10 if len(sig)>8*SR else 0.20        # الخلفيات الطويلة أهدأ من الضربات
    if k.startswith("cc-ambience"): base=0.035  # 4.7: صوت الغرفة والأجواء ينحس ما ينسمع (30 dB تحت الكلام)
    for v in arr:
        vv=list(v) if isinstance(v,list) else [v]; t0=vv[0]; g=vv[1] if len(vv)>1 and vv[1] is not None else 1; d=vv[2] if len(vv)>2 else None
        off=int(max(0.0,float(vv[3] or 0))*SR) if len(vv)>3 else 0; fi=float(vv[4] or 0) if len(vv)>4 else 0.0; fo=vv[5] if len(vv)>5 else None
        src=sig[off:]
        L=len(src) if not d else min(len(src),int(float(d)*SR)); L=max(0,min(L,int((VEND-float(t0))*SR)))
        if L<200: continue
        s=src[:L].copy(); f=min(L,int((0.25 if fo is None else max(0.0,float(fo)))*SR))
        if f>1: s[-f:]*=np.linspace(1,0,f)
        k_=min(L,int(fi*SR))
        if k_>1: s[:k_]*=np.linspace(0,1,k_)
        if len(sig)>8*SR and _DUCK<1:
            i0=max(0,int(float(t0)*SR)); m=min(len(s),n-i0); s[:m]*=_DUCKENV[i0:i0+m]
        add(s,float(t0),base*float(g or 1))
buf=np.clip(buf,-0.95,0.95)
pcm=(buf*32767).astype('<i2')
st=np.repeat(pcm[:,None],2,axis=1).ravel()
w=wave.open(S+"sfx.wav","wb");w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
w.writeframes(st.tobytes());w.close()
print("sfx ok peak",round(float(np.max(np.abs(buf))),3),"dur",round(len(pcm)/SR,2))
