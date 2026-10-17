# -*- coding: utf-8 -*-
"""شيل أي جملة من الفيديو بحذفها من النص.

    python 10_script_edit.py <work> show              # يطبع الجُمل مرقّمة (وينبّه للجُمل المعادة)
    python 10_script_edit.py <work> dupes             # الجُمل المعادة وحدها
    python 10_script_edit.py <work> drop 3 7 12       # يشيل هالجُمل من الفيديو
    python 10_script_edit.py <work> keep 1 2 5 6      # يبقي هذي بس ويشيل الباقي
    python 10_script_edit.py <work> apply             # يقرأ script.txt المعدّل ويشيل الناقص منه
    python 10_script_edit.py <work> undo              # يرجّع آخر تعديل
    (أضف --dry لأي أمر: يوريك النتيجة بلا ما يغيّر شي)

الفكرة: الجملة اللي تنحذف من النص ينحذف مقطعها من الفيديو والصوت، وكل اللي بعدها ينزاح لمكانه.
يعدّل: cut.json (مقاطع الفيديو) · caps.json (الكابشن) · sfx.json (أوقات المؤثرات).
بعده: أعد بناء الفيديو ← 03_cut_zoom.py ثم استخراج الفريمات ثم الرسم.
"""
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
import json, os, sys, shutil

W = os.path.abspath(sys.argv[1])
CMD = sys.argv[2] if len(sys.argv) > 2 else "show"
DRY = "--dry" in sys.argv
ARGS = [a for a in sys.argv[3:] if not a.startswith("--")]
P = lambda n: os.path.join(W, n)
PAD_L, PAD_R, MIN_SEG = 0.08, 0.12, 0.20

def load(n): return json.load(open(P(n), encoding="utf-8"))
def save(n, d):
    if DRY: return
    if os.path.exists(P(n)):
        if not os.path.exists(P(n + ".orig")): shutil.copy(P(n), P(n + ".orig"))
        shutil.copy(P(n), P(n + ".bak"))
    json.dump(d, open(P(n), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# ── كشف الجملة المعادة ─────────────────────────────────────────────────────
# لما يعيد صياغة جملة، الغالب إن الأولى هي الغلط والثانية هي التصحيح.
import re as _re, difflib
_STOP = {"في","من","على","الى","إلى","عن","مع","هذا","هذي","هذه","ذلك","اللي","الي",
         "و","او","أو","ثم","بس","يا","ان","أن","إن","ما","لا","كل","كان","صار","هو","هي"}
def _norm(w):
    w = _re.sub(r"[\u064B-\u0652\u0640]", "", w)          # تشكيل وتطويل
    w = w.replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ة","ه").replace("ى","ي")
    if len(w) > 4 and w.startswith("ال"): w = w[2:]
    return w
def _words(c): return [_norm(x["t"]) for x in c["w"]]
def _sim(a, b):
    """تشابه جملتين: نسبة الكلمات المشتركة من الأقصر + تشابه الحروف"""
    wa, wb = [w for w in a if w not in _STOP], [w for w in b if w not in _STOP]
    if not wa or not wb: return 0.0
    shared = len(set(wa) & set(wb)) / min(len(wa), len(wb))
    chars  = difflib.SequenceMatcher(None, " ".join(a), " ".join(b)).ratio()
    return max(shared, chars)
def find_dupes(cards, win=2, th=0.60):
    out = []
    for i in range(len(cards) - 1):
        for j in range(i + 1, min(i + 1 + win, len(cards))):
            r = _sim(_words(cards[i]), _words(cards[j]))
            if r >= th: out.append((i, j, r)); break
    return out

caps = load("caps.json"); cards = caps["cards"]
def line(i, c):
    txt = " ".join(w["t"] for w in c["w"])
    return f"{i+1:>3}  [{int(c['s']//60):02d}:{c['s']%60:05.2f}]  {txt}"

# ── show ──────────────────────────────────────────────────────────────────
if CMD == "show":
    body = ("# احذف أي سطر ما تبيه بالفيديو، واحفظ الملف، ثم:  python 10_script_edit.py <work> apply\n"
            "# (لا تغيّر الأرقام — هي اللي تربط السطر بمقطعه)\n\n"
            + "\n".join(line(i, c) for i, c in enumerate(cards)) + "\n")
    if not DRY: open(P("script.txt"), "w", encoding="utf-8").write(body)
    print(body)
    print(f"المدة الحالية: {caps['total']:.2f} ثانية · {len(cards)} جملة")
    d = find_dupes(cards)
    if d:
        print("\n🔁 جُمل يبدو إنك أعدتها — والغالب إن الأولى هي الغلط:")
        for i, j, r in d:
            print(f"   {i+1} ← {j+1}  (تشابه {r*100:.0f}٪)")
            print(f"      {i+1}: " + " ".join(w['t'] for w in cards[i]['w']))
            print(f"      {j+1}: " + " ".join(w['t'] for w in cards[j]['w']))
        print("   الاقتراح: drop " + " ".join(str(i+1) for i,_,_ in d) + "   (اعرضه على المستخدم قبل التنفيذ)")
    sys.exit(0)

if CMD == "dupes":
    d = find_dupes(cards)
    if not d: print("ما فيه جملة معادة."); sys.exit(0)
    for i, j, r in d:
        print(f"{i+1} ← {j+1}  (تشابه {r*100:.0f}٪)")
        print(f"   {i+1}: " + " ".join(w['t'] for w in cards[i]['w']))
        print(f"   {j+1}: " + " ".join(w['t'] for w in cards[j]['w']))
    print("\nلحذف الأولى من كل زوج:  drop " + " ".join(str(i+1) for i,_,_ in d))
    sys.exit(0)

if CMD == "undo":
    n = 0
    for f in ("cut.json", "caps.json", "sfx.json", "studio.json"):
        if os.path.exists(P(f + ".bak")): shutil.copy(P(f + ".bak"), P(f)); n += 1
    print(f"↩️ رجّعت {n} ملفاً لآخر نسخة." if n else "ما فيه نسخة سابقة.")
    sys.exit(0)

# ── أي جُمل تنشال؟ ────────────────────────────────────────────────────────
if CMD == "drop":
    drop = {int(a) - 1 for a in ARGS}
elif CMD == "keep":
    keep_i = {int(a) - 1 for a in ARGS}
    drop = {i for i in range(len(cards)) if i not in keep_i}
elif CMD == "apply":
    if not os.path.exists(P("script.txt")): sys.exit("❌ ما فيه script.txt — شغّل show أول")
    alive = set()
    for ln in open(P("script.txt"), encoding="utf-8"):
        ln = ln.strip()
        if not ln or ln.startswith("#"): continue
        head = ln.split(None, 1)[0]
        if head.isdigit(): alive.add(int(head) - 1)
    drop = {i for i in range(len(cards)) if i not in alive}
else:
    sys.exit("الأوامر: show · dupes · drop · keep · apply · undo")

drop = {i for i in drop if 0 <= i < len(cards)}
if not drop: sys.exit("ما فيه جملة تنشال — بلا تغيير.")
if len(drop) == len(cards): sys.exit("❌ هذا يشيل الفيديو كله — ألغيت.")

# ── فترات الحذف على التايم-لاين الحالي ────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cutmap

# 4.9: الكلام المهم ما ينحذف بدون موافقته. الجملة المعادة (لها نسخة باقية) مسموح حذفها.
dup_of = {i: j for i, j, _ in find_dupes(cards)} | {j: i for i, j, _ in find_dupes(cards)}
FORCE = "--force" in sys.argv
risky = []
for i in sorted(drop):
    j = dup_of.get(i)
    if j is not None and j not in drop: continue          # إعادة: النسخة الثانية باقية
    why = cutmap.important(" ".join(w["t"] for w in cards[i]["w"]))
    if i >= len(cards) - 2: why = why + ["آخر كلامك بالمقطع: المقطع بينتهي بدونه"]
    if why: risky.append((i, why))
try: _brief = json.load(open(P("brief.json"), encoding="utf-8"))
except Exception: _brief = {}
plain = [i for i in drop if not (dup_of.get(i) is not None and dup_of.get(i) not in drop)]
if not FORCE and (risky or (_brief.get("length") == "keep" and plain)):
    print("⛔ ما حذفت شي. هذي الجمل فيها كلام مهم" + (" (واختار بالأسئلة «خله نفس الطول»)" if _brief.get("length") == "keep" else "") + ":")
    for i, why in risky: print("   " + line(i, cards[i]).strip() + "   ← " + "، ".join(why))
    if _brief.get("length") == "keep":
        for i in plain:
            if i not in dict(risky): print("   " + line(i, cards[i]).strip())
    print("اسأله أول (اعرض الجمل كما هي). لو وافق: أعد نفس الأمر مع --force")
    sys.exit(2)

iv = []
for i in sorted(drop):
    c = cards[i]
    a = max(0.0, c["w"][0]["s"] - PAD_L)
    b = min(caps["total"], c["w"][-1]["e"] + PAD_R)
    if i + 1 < len(cards): b = min(b, cards[i + 1]["w"][0]["s"] - 0.02)
    if i > 0: a = max(a, cards[i - 1]["w"][-1]["e"] + 0.02)
    if b > a: iv.append([a, b])
guards = [(w["s"], w["e"]) for k, c in enumerate(cards) if k not in drop for w in c["w"]]
cut = load("cut.json"); keep = [list(x) for x in cut["keep"]]
try: new_keep, remap, gone = cutmap.remove(W, keep, iv, guards)
except ValueError as e: sys.exit("❌ " + str(e))

def shift(t):
    v = remap(t); return v if v is not None else remap(t, "prev")
def inside(t): return remap(t) is None

print("راح ينشال:")
for i in sorted(drop): print("  ✂️ " + line(i, cards[i]).strip())
print(f"المدة: {caps['total']:.2f} → {caps['total']-gone:.2f} ثانية (‎-{gone:.2f})")
if DRY: sys.exit(0)

cut["keep"] = new_keep; cut["edited"] = True
cut["total"] = round(sum(b - a for a, b in new_keep), 3)
save("cut.json", cut)
kept_caps = {**caps, "cards": [c for i, c in enumerate(cards) if i not in drop]}
save("caps.json", cutmap.remap_caps(kept_caps, remap, cut["total"]))

if os.path.exists(P("studio.json")):     # الطبقات والمؤثرات تتبع وقتها بالأصل
    st = load("studio.json"); hs = (st.get("hs") if isinstance(st.get("hs"), dict) else st)
    moved = []
    for L in hs.get("layers") or []:
        s2, e2 = remap(L.get("s", 0), "next"), remap(L.get("e", 0), "prev")
        if s2 is not None and e2 is not None and e2 - s2 > 0.15: moved.append({**L, "s": round(s2, 3), "e": round(e2, 3)})
    if hs.get("layers") is not None: hs["layers"] = moved; save("studio.json", st)

if os.path.exists(P("sfx.json")):
    sfx = load("sfx.json"); moved = 0; killed = 0
    for k, v in list(sfx.items()):
        if not isinstance(v, list): continue
        out = []
        for t in v:
            tv = t[0] if isinstance(t, list) else t
            if not isinstance(tv, (int, float)): out.append(t); continue
            if inside(tv): killed += 1
            else: out.append(([round(shift(tv), 3)] + list(t[1:])) if isinstance(t, list) else round(shift(tv), 3)); moved += 1
        sfx[k] = out
    save("sfx.json", sfx)
    print(f"المؤثرات: {moved} انزاحت · {killed} انشالت")

print(f"""
✅ تم. الحين أعد بناء الفيديو:
   python scripts/03_cut_zoom.py {W}
   mkdir -p {W}/vfr && ffmpeg -v error -i {W}/cutz.mp4 -vf fps=30 -q:v 3 -y {W}/vfr/%05d.jpg
   node scripts/04_render_frames.js {W} all --force     (أو 04b_remotion.sh {W} render)
⚠️ لو كنت مصمّماً مشاهد بأوقات ثابتة — أوقاتها انزاحت، راجعها.
↩️ للتراجع: python scripts/10_script_edit.py {W} undo""")
