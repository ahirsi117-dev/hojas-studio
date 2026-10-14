#!/usr/bin/env python3
"""أخبار الذكاء في موقع هوجاس: الملف site/data/news.json هو المرجع وهو ذاكرة اللي نزل.

  python3 site/news.py check             يتحقق من الملف ويحسب نسبة الوثوق لكل خبر
  python3 site/news.py seen [DAYS]       يطبع مفاتيح وعناوين آخر DAYS يوم (افتراضي 30) قبل اختيار أخبار جديدة
  python3 site/news.py add NEW.json      يضيف أخبار جديدة ويرفض المكرر (نفس المفتاح أو نفس رابط المصدر)
  python3 site/news.py posted KEY tiktok|instagram [URL]   يعلّم إن الخبر نزل في الحساب

نسبة الوثوق تنحسب من المصادر، ما تنكتب باليد:
  مصدر رسمي من الشركة = 95 · مصدرين إخباريين معروفين = 85 · مصدر إخباري واحد = 70 · تواصل اجتماعي فقط = 45
  تسريب أو إشاعة (rumor: true) = 35 بالكثير
"""
import json, os, re, sys
from datetime import date, timedelta

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "news.json")
TYPES = {"official", "outlet", "social"}
KEY_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
KEEP = 300


def trust(item):
    types = [s["type"] for s in item["sources"]]
    if "official" in types:
        t = 95
    elif types.count("outlet") >= 2:
        t = 85
    elif "outlet" in types:
        t = 70
    else:
        t = 45
    if item.get("rumor"):
        t = min(t, 35)
    return t


def label(t):
    return "مؤكد من المصدر" if t >= 90 else "موثوق" if t >= 75 else "حسب التقارير" if t >= 60 else "غير مؤكد"


def validate(it, i):
    def bad(msg):
        sys.exit(f"ERROR item {i} ({it.get('key', '?')}): {msg}")
    for f in ("key", "date", "company", "category", "title", "summary", "sources"):
        if not it.get(f):
            bad(f"missing {f}")
    if not KEY_RE.match(it["key"]):
        bad("key must be lowercase-with-hyphens")
    try:
        date.fromisoformat(it["date"])
    except ValueError:
        bad("date must be YYYY-MM-DD")
    if len(it["title"]) > 70:
        bad("title longer than 70 characters")
    if len(it["summary"]) > 260:
        bad("summary longer than 260 characters")
    for s in it["sources"]:
        if s.get("type") not in TYPES or not str(s.get("url", "")).startswith("https://") or not s.get("name"):
            bad("each source needs name, https url, and type official|outlet|social")
    if "—" in it["title"] + it["summary"] + it.get("note", ""):
        bad("no long dash (—) in site text")
    it["trust"] = trust(it)
    it.setdefault("posted", {})
    return it


def load():
    return json.load(open(PATH, encoding="utf-8")) if os.path.exists(PATH) else []


def save(items):
    items.sort(key=lambda x: (x["date"], x["key"]), reverse=True)
    json.dump(items[:KEEP], open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    items = load()
    if cmd == "check":
        keys = set()
        for i, it in enumerate(items):
            validate(it, i)
            if it["key"] in keys:
                sys.exit(f"ERROR duplicate key {it['key']}")
            keys.add(it["key"])
        save(items)
        print(f"ok: {len(items)} خبر")
    elif cmd == "seen":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        since = (date.today() - timedelta(days=days)).isoformat()
        for it in items:
            if it["date"] >= since:
                p = ",".join(k for k, v in it.get("posted", {}).items() if v) or "-"
                print(f"{it['date']} | {it['key']} | {it['title']} | posted: {p}")
    elif cmd == "add":
        new = json.load(open(sys.argv[2], encoding="utf-8"))
        keys = {it["key"] for it in items}
        urls = {s["url"] for it in items for s in it["sources"]}
        added = 0
        for i, it in enumerate(new):
            validate(it, i)
            dup = it["key"] in keys or any(s["url"] in urls for s in it["sources"])
            if dup:
                print(f"skip (موجود): {it['key']}")
                continue
            items.append(it)
            keys.add(it["key"])
            urls.update(s["url"] for s in it["sources"])
            added += 1
            print(f"added: {it['key']} ({it['trust']}%)")
        save(items)
        print(f"{added} جديد، {len(new) - added} مكرر")
    elif cmd == "posted":
        key, plat = sys.argv[2], sys.argv[3]
        if plat not in ("tiktok", "instagram"):
            sys.exit("ERROR platform must be tiktok or instagram")
        url = sys.argv[4] if len(sys.argv) > 4 else True
        for it in items:
            if it["key"] == key:
                it.setdefault("posted", {})[plat] = url
                save(items)
                print(f"marked {key} as posted on {plat}")
                return
        sys.exit(f"ERROR no item with key {key}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
