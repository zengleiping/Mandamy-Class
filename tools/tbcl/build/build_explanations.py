#!/usr/bin/env python3
"""從教育部《重編國語辭典》釋義整理「簡易說法」：成語、較難的詞怎麼用比較簡單的話說。
例：人才濟濟 →「人才很多」（釋義：形容人才很多）、重視 →「認為重要而加以注意」。
做法：每個詞取釋義裡「形容／比喻／指…」後面的短句（沒有這類標記時，一般詞才取第一句），
      去掉引文、例句、「也作」，長度 ≤ 24 字，且不含詞本身；每詞最多 2 個。
網頁執行時會用 TBCL 詞表檢查這些說法在目標等級下有沒有超綱，通過的才會列出。
輸出 ../data/explanations.json：{"詞": ["說法1", "說法2"]}
用法：python3 build_explanations.py dict-revised.json [--xinhua idiom.json]
  --xinhua：辭典沒有的成語，改用 chinese-xinhua 的釋義（簡轉繁）補上。"""
import json, os, re, sys

HAN = re.compile(r"^[㐀-鿿]+$")
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
MARK = re.compile(r"(?:亦用以形容|常用以形容|多用以形容|用以形容|用來形容|形容|比喻|喻指|泛指|引申為|謂|指稱|指|表示)")


def tidy(t):
    t = re.sub(r"《[^》]*》", "", t)
    t = re.sub(r"[「『][^」』]*[」』]", "", t)
    t = re.sub(r"[（(][^）)]*[）)]", "", t)
    t = re.sub(r"[也亦]作.*$", "", t)
    t = re.sub(r"如[：:].*$", "", t)
    t = re.sub(r"語本.*$|典出.*$|出自.*$", "", t)
    return re.sub(r"\s+", "", t).strip("，、；：。 ")


def explain(title, defs, idiom):
    out = []
    for df in defs:
        sents = [s for s in re.split(r"[。；]", df) if s.strip()]
        has_mark = any(MARK.search(s) for s in sents)
        for k, s in enumerate(sents):
            m = MARK.search(s)
            if m:
                body = s[m.end():]
                body = re.sub(r"^[為作成是]", "", body)
            elif k == 0 and (not idiom or not has_mark):
                body = s                              # 一般詞，或成語的釋義裡沒有「形容／比喻」時：第一句就是白話解釋；有標記時第一句多半是字面義，不取
            else:
                continue
            body = tidy(body)
            body = re.sub(r"的?(樣子|情形|狀態)$", "", body) if len(body) > 6 else body
            if 3 <= len(body) <= 24 and title not in body and HAN.match(body.replace("、", "").replace("，", "")) and body not in out:
                out.append(body)
        if len(out) >= 2:
            break
    return out[:2]


def main(path, xinhua=None):
    tb = {}
    for ln in open(os.path.join(DATA, "tbcl.tsv"), encoding="utf8"):
        if ln[0] != "#":
            f = ln.rstrip("\n").split("\t")
            tb[f[0]] = int(f[1])
    idioms = set(open(os.path.join(DATA, "lexicon-idioms.txt"), encoding="utf8").read().split())
    lex = set(open(os.path.join(DATA, "lexicon.txt"), encoding="utf8").read().split())
    res = {}
    for e in json.load(open(path, encoding="utf8")):
        t = e.get("title", "")
        if not HAN.match(t) or len(t) < 2:
            continue
        if not (t in idioms or t in lex or tb.get(t, 0) >= 2):
            continue
        defs = [df["def"] for h in e.get("heteronyms", []) for df in h.get("definitions", []) if df.get("def")]
        ex = explain(t, defs, t in idioms or len(t) >= 4)
        if ex:
            res[t] = ex
    if xinhua:
        from opencc import OpenCC
        cc = OpenCC("s2twp")
        for x in json.load(open(xinhua, encoding="utf8")):
            t = cc.convert(x["word"])
            if t in res or not (t in idioms):
                continue
            ex = explain(t, [cc.convert(x.get("explanation", ""))], True)
            if ex:
                res[t] = ex
    json.dump(res, open(os.path.join(DATA, "explanations.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    print(len(res))


if __name__ == "__main__":
    a = sys.argv[1:]
    xin = a[a.index("--xinhua") + 1] if "--xinhua" in a else None
    main(next((x for x in a if x.endswith(".json") and x != xin), "dict-revised.json"), xin)
