#!/usr/bin/env python3
"""把人工（Claude）撰寫的成語簡單說法 curated-idioms-*.tsv 整理成 ../data/curated.json，並用 TBCL 詞表驗證。
輸入每行：成語<TAB>說法1（較貼近原意）<TAB>說法2（最簡單）
驗證：每個說法用 CKIP 斷詞後逐詞比對 TBCL，算出「至少要目標等級幾級才不超綱」(lv，1–7；詞表沒有的詞一律不通過，記為 0)。
輸出：{"成語": [[說法, lv, 角色], ...]}（角色 P 一般／A 接「的」／D 接「地」／C 接「得」；lv=0 表示含詞表沒有的詞，網頁仍會再用目標等級確認）
角色說法來自 curated-roles.tsv（成語<TAB>角色<TAB>說法1<TAB>說法2）。
另外輸出 ../data/lexicon-curated.txt：精選成語中，成語字典還沒收的詞（讓斷詞認得）。
用法：python3 build_curated.py        （需要 pip install ckip-transformers）"""
import glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "python"))
import tbcl_check as t

rows = []
for f in sorted(glob.glob(os.path.join(HERE, "curated-idioms-*.tsv"))):
    for ln in open(f, encoding="utf8"):
        if not ln.strip() or ln[0] == "#":
            continue
        c = ln.rstrip("\n").split("\t")
        vs = []
        for v in c[1:]:
            v = v.strip()
            if v and v not in vs:
                vs.append(v)
        if len(c) >= 2 and vs:
            rows.append((c[0].strip(), vs))

roles = []
rp = os.path.join(HERE, "curated-roles.tsv")
if os.path.exists(rp):
    for ln in open(rp, encoding="utf8"):
        if not ln.strip() or ln[0] == "#":
            continue
        c = ln.rstrip("\n").split("\t")
        if len(c) >= 3 and c[1] in ("A", "D", "C", "P"):
            roles.append((c[0].strip(), c[1], [v.strip() for v in c[2:] if v.strip()]))

driver = t.get_ckip()
tbcl = t.load_tbcl()


def min_level(text):
    for lv in range(1, 8):
        r = t.check_materials(text, lv, segmenter="ckip", ckip_driver=driver, exclude_proper_nouns=False)
        if not r.over and not r.unlisted:
            return lv
    return 0


out = {}
known = set(t.load_idioms()) | set(t.load_lexicon()) | set(tbcl)
missing = []
cache = {}


def lv_of(v):
    if v not in cache:
        cache[v] = min_level(v)
    return cache[v]


for w, vs in rows:
    out[w] = [[v, lv_of(v), "P"] for v in vs]
    if w not in known and len(w) >= 3:
        missing.append(w)
json.dump(out, open(os.path.join(HERE, "..", "data", "curated.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
open(os.path.join(HERE, "..", "data", "lexicon-curated.txt"), "w", encoding="utf8").write("\n".join(missing))
for w, role, vs in roles:
    lst = out.setdefault(w, [])
    if w not in known and len(w) >= 3 and w not in missing:
        missing.append(w)
    for v in vs:
        if all(x[0] != v or x[2] != role for x in lst):
            lst.append([v, lv_of(v), role])
json.dump(out, open(os.path.join(HERE, "..", "data", "curated.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
open(os.path.join(HERE, "..", "data", "lexicon-curated.txt"), "w", encoding="utf8").write("\n".join(missing))
import collections
c = collections.Counter(min((x[1] for x in v if x[1]), default=0) for v in out.values())
print("成語", len(out), "字典缺", len(missing), "最簡版本需要的最低等級分布", dict(sorted(c.items())))
