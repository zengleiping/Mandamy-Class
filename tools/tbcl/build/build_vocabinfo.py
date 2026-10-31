#!/usr/bin/env python3
"""產生 ../data/vocabinfo.json：每個 TBCL 詞的 拼音／詞性／英文（備課包用，老師可再修改）。
來源：
  - CC-CEDICT（CC BY-SA 4.0）的繁體詞條 → 英文、拼音
  - jieba 預設詞典（MIT）的詞性標記（先轉簡體再查）→ 詞性（僅供參考）
用法：python3 build_vocabinfo.py cedict_ts.u8 /path/to/jieba/dict.txt
需要 opencc（pip install opencc-python-reimplemented 或 opencc）。"""
import re, sys, json, os
try:
    from opencc import OpenCC
    t2s = OpenCC("t2s").convert
except Exception:
    t2s = lambda s: s
HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(HERE, "..", "data")

TONE = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}
def syl(s):
    m = re.match(r"^([a-zA-ZüÜ:]+?)([1-5])$", s)
    if not m: return s
    b, t = m.group(1).replace("u:", "ü").replace("U:", "Ü"), int(m.group(2))
    if t == 5: return b
    low = b.lower()
    for v in ("a", "e", "ou"):
        if v in low:
            i = low.index(v); c = low[i]
            return b[:i] + TONE[c][t-1] + b[i+1:]
    idx = max((i for i, c in enumerate(low) if c in TONE), default=-1)
    if idx < 0: return b
    return b[:idx] + TONE[low[idx]][t-1] + b[idx+1:]
def pinyin(p): return " ".join(syl(x) for x in p.split())

def load_cedict(path):
    d = {}
    for ln in open(path, encoding="utf8"):
        if ln.startswith("#"): continue
        m = re.match(r"^(\S+) (\S+) \[([^\]]+)\] /(.+)/$", ln.strip())
        if not m: continue
        trad, _, py, defs = m.groups()
        defs = [x for x in defs.split("/") if x]
        d.setdefault(trad, []).append((py, defs))
    return d

BAD = re.compile(r"^(surname|variant of|old variant|erhua|abbr\.|see |also written|CL:|Taiwan pr\.|used in|\(Tw\)|\(dialect\))", re.I)
def clean(defs):
    out = []
    for x in defs:
        x = re.sub(r"\s*\(.*?\)\s*", " ", x) if len(x) > 40 else x
        x = re.sub(r"\s*\([^)]*[\u4e00-\u9fff][^)]*\)", "", x)   # 括號裡有中文／量詞標記的略過
        x = re.sub(r"\s*\(,[^)]*\)", "", x)
        x = re.sub(r"\s+([;,])", r"\1", x)
        x = re.sub(r"CL:[^,;]*", "", x)
        x = re.sub(r"\S+\|\S+\[[^\]]*\]", "", x).strip(" ,;")
        if not x or BAD.search(x) or re.search(r"[一-鿿]", x) and len(x) < 3: continue
        out.append(x)
        if len(out) >= 3: break
    return out
try:
    from pypinyin import lazy_pinyin, Style
except Exception:
    lazy_pinyin = None
def common_reading(w):
    if not lazy_pinyin: return None
    return " ".join(lazy_pinyin(w, style=Style.TONE3, neutral_tone_with_five=True)).replace("v", "u:")
def pick(entries, w=""):
    want = (common_reading(w) or "").lower()
    cands = []
    for py, defs in entries:
        c = clean(defs)
        if not c: continue
        if py[:1].isupper() and len(entries) > 1: continue   # 專有名詞讀音先略過
        cands.append((py, c))
    if not cands: return None
    first = cands[0]
    for py, c in cands:                                      # 優先用最常見的讀音
        if py.lower() == want: first = (py, c); break
    if len(first[1]) == 1 and len(cands) > 1:                # 只有一個意思時，補上其他讀音的意思
        extra = [x for py, c in cands if py != first[0] for x in c if x not in first[1]][:2]
        return (first[0], first[1] + extra)
    return first

POS = {"n": "名詞", "nr": "名詞", "ns": "名詞", "nt": "名詞", "nz": "名詞", "ng": "名詞", "nl": "名詞",
       "v": "動詞", "vn": "動詞", "vd": "動詞", "vg": "動詞", "vi": "動詞", "vl": "動詞",
       "a": "形容詞", "ad": "形容詞", "an": "形容詞", "ag": "形容詞", "al": "形容詞",
       "d": "副詞", "dg": "副詞", "m": "數詞", "mq": "數詞", "q": "量詞", "r": "代名詞", "rr": "代名詞", "rz": "代名詞",
       "p": "介詞", "c": "連詞", "u": "助詞", "y": "助詞", "e": "感嘆詞", "o": "擬聲詞", "t": "時間詞", "f": "方位詞", "s": "處所詞", "z": "狀態詞", "b": "區別詞"}
def load_pos(path):
    d = {}
    for ln in open(path, encoding="utf8"):
        p = ln.split()
        if len(p) >= 3 and p[2] in POS: d[p[0]] = POS[p[2]]
    return d

def main():
    ced = load_cedict(sys.argv[1]); pos = load_pos(sys.argv[2])
    out, nE, nP = {}, 0, 0
    for ln in open(os.path.join(DATA, "tbcl.tsv"), encoding="utf8"):
        if ln.startswith("#") or not ln.strip(): continue
        w = ln.split("\t")[0]
        if w in out: continue
        e = pick(ced[w], w) if w in ced else None
        p = pos.get(t2s(w), "")
        if not e and not p: continue
        out[w] = [pinyin(e[0]) if e else "", p, "; ".join(e[1]) if e else ""]
        nE += bool(e); nP += bool(p)
    json.dump(out, open(os.path.join(DATA, "vocabinfo.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    print("詞", len(out), "有英文", nE, "有詞性", nP, "大小", os.path.getsize(os.path.join(DATA, "vocabinfo.json")))
main()
