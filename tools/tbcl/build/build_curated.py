#!/usr/bin/env python3
"""把人工（Claude）撰寫的成語簡單說法 curated-idioms-*.tsv 整理成 ../data/curated.json，並用 TBCL 詞表驗證。
輸入每行：成語<TAB>說法1（較貼近原意）<TAB>說法2（最簡單）
驗證：每個說法用 CKIP 斷詞後逐詞比對 TBCL，算出「至少要目標等級幾級才不超綱」(lv，1–7；詞表沒有的詞一律不通過，記為 0)。
輸出：{"成語": [[說法, lv], ...]}（lv=0 表示含詞表沒有的詞，網頁仍會再用目標等級確認）
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

driver = t.get_ckip()
tbcl = t.load_tbcl()


def min_level(text):
    for lv in range(1, 8):
        r = t.check_materials(text, lv, segmenter="ckip", ckip_driver=driver, exclude_proper_nouns=False)
        if not r.over and not r.unlisted:
            return lv
    return 0


out, known = {}, set(t.load_idioms()) | set(t.load_lexicon()) | set(tbcl)
missing = []
for w, vs in rows:
    out[w] = [[v, min_level(v)] for v in vs]
    if w not in known and len(w) >= 3:
        missing.append(w)
json.dump(out, open(os.path.join(HERE, "..", "data", "curated.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
open(os.path.join(HERE, "..", "data", "lexicon-curated.txt"), "w", encoding="utf8").write("\n".join(missing))
import collections
c = collections.Counter(min((lv for _, lv in v if lv), default=0) for v in out.values())
print("成語", len(out), "字典缺", len(missing), "最簡版本需要的最低等級分布", dict(sorted(c.items())))
