#!/usr/bin/env python3
"""離線整理「換詞表」：對每個高等級詞（和成語），從辭典資料找出意思相近、等級較低的詞。
流程：辭典同義詞 ＋ 詞義相似度（詞義說明向量）→ 對 TBCL 等級 → 輸出 ../data/replacements.json
  1. 辭典同義詞：重編國語辭典的「同義詞」欄、近義詞工具書詞組、教育部近義詞（最可靠，標 s）
  2. 釋義用語（標 d）：來源詞的辭典釋義裡，直接用到的較低等級 TBCL 詞（例如「重視：認為重要而加以注意」→ 注意），再用詞義向量排序
  3. 詞義相似（標 e）：把每個詞的辭典釋義轉成向量（BAAI/bge-base-zh-v1.5），找最接近的 TBCL 詞；只收相似度很高的（≥0.82）
  4. 只留等級比來源詞低的候選；詞性（辭典標的名／動／形／副…）不同的不收
輸出格式：{"詞": [[候選詞, 候選等級, 來源 s/d/e/p, 分數0-100], ...]}（最多 5 個；s 優先，其次 p、d，最後 e；p＝疊字成語取前兩字）
自動比對只看詞義、不看句子，換進句子不一定通順，結果僅供老師參考。
用法：python3 build_replacements.py dict-revised.json [--limit N] [--only 詞1,詞2]（抽查用）
需要：pip install sentence-transformers（第一次會下載約 100MB 的向量模型）"""
import json, re, sys, os, argparse

HAN = re.compile(r"^[㐀-鿿]+$")
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")


def load_tbcl():
    tb = {}
    for ln in open(os.path.join(DATA, "tbcl.tsv"), encoding="utf8"):
        if ln[0] != "#":
            f = ln.rstrip("\n").split("\t")
            tb[f[0]] = int(f[1])
    return tb


def clean_def(d):
    d = re.sub(r"《[^》]*》", "", d)              # 書名（引文出處）
    d = re.sub(r"[「『][^」』]*[」』]", "", d)      # 引文、例句
    d = re.sub(r"如[：:].*$", "", d)               # 「如：…」例子
    d = re.sub(r"[也亦]作.*$", "", d)              # 「也作…」異體
    d = re.sub(r"參見.*$", "", d)
    d = re.sub(r"\s+", "", d)
    return d[:80]


def parse_dict(path):
    info = {}
    for e in json.load(open(path, encoding="utf8")):
        t = e.get("title", "")
        if not HAN.match(t):
            continue
        defs, pos, syn, ant = [], set(), [], []
        for h in e.get("heteronyms", []):
            for df in h.get("definitions", []):
                if df.get("def"):
                    defs.append(clean_def(df["def"]))
                if df.get("type"):
                    pos.add(df["type"])
                for s in re.split(r"[,，、]", df.get("synonyms", "") or ""):
                    if HAN.match(s.strip()):
                        syn.append(s.strip())
                for s in re.split(r"[,，、]", df.get("antonyms", "") or ""):
                    if HAN.match(s.strip()):
                        ant.append(s.strip())
        info[t] = {"def": next((x for x in defs if len(x) >= 4), defs[0] if defs else ""), "pos": pos, "syn": syn, "ant": set(ant)}
    return info


def postfilter(info, tb, data, df_max=400, d_min=65):
    """去掉太籠統的釋義用語（如「比喻」「沒有」「形容」，出現在很多詞的釋義裡），釋義用語相似度需 ≥ d_min。"""
    import collections
    df = collections.Counter()
    for v in info.values():
        t = v["def"]
        df.update({t[k:k + n] for n in (2, 3, 4) for k in range(len(t) - n + 1)} & set(tb))
    NEG = "不無沒非未難勿莫否"

    def negated(w, c):
        t = info[w]["def"]
        i = t.find(c)
        return i > 0 and t[i - 1] in NEG            # 「困難：不容易」→ 容易 是反義，不能當換詞

    # p：疊字成語取前兩字（小心翼翼→小心、人才濟濟→人才）、AABB 疊字取 AB（高高興興→高興）
    words4 = [w for w in list(tb) + list(data) if len(w) == 4]
    for w in set(words4):
        sl = tb.get(w, 99)
        cand = None
        if w[2] == w[3] and w[0] != w[1] and w[:2] in tb:
            cand = w[:2]
        elif w[0] == w[1] and w[2] == w[3] and w[0] != w[2] and w[1] + w[2] in tb:
            cand = w[1] + w[2]
        if cand and tb[cand] < sl and cand != w:
            lst = data.setdefault(w, [])
            if all(r[0] != cand for r in lst):
                lst.insert(0, [cand, tb[cand], "p", 70])
    out = {}
    for w, rs in data.items():
        if w not in info:
            out[w] = rs
            continue
        keep = [r for r in rs if r[0] not in info[w]["ant"] and not (r[2] == "d" and (df[r[0]] > df_max or r[3] < d_min or negated(w, r[0])))]
        if keep:
            out[w] = keep
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dict_json")
    ap.add_argument("--postfilter", default="", help="只對既有的結果檔做後處理（不重新算向量）")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="", help="只處理這些來源詞（逗號分隔），抽查用")
    ap.add_argument("--model", default="BAAI/bge-base-zh-v1.5")
    ap.add_argument("--out", default=os.path.join(DATA, "replacements.json"))
    a = ap.parse_args()

    tb = load_tbcl()
    info = parse_dict(a.dict_json)
    if a.postfilter:
        data = postfilter(info, tb, json.load(open(a.postfilter, encoding="utf8")))
        json.dump(data, open(a.out, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
        print("後處理後有候選的詞", len(data), "->", a.out)
        return
    idioms = set(open(os.path.join(DATA, "lexicon-idioms.txt"), encoding="utf8").read().split())
    lex = set(open(os.path.join(DATA, "lexicon.txt"), encoding="utf8").read().split())

    # 來源詞：等級 ≥2 的 TBCL 詞，加上詞表沒有的成語／長詞
    sources = [w for w, l in tb.items() if l >= 2 and len(w) >= 2] + sorted((idioms | lex) - set(tb))
    sources = [w for w in sources if w in info and info[w]["def"]]
    if a.only:
        want = a.only.split(",")
        sources = [w for w in want if w in info and info[w]["def"]]
    if a.limit:
        sources = sources[: a.limit]
    # 候選詞：有辭典詞義的 TBCL 詞
    cands = [w for w in tb if w in info and info[w]["def"] and len(w) >= 1]

    # 1. 辭典同義詞（雙向）
    syn = {}
    def link(x, y):
        if x != y:
            syn.setdefault(x, set()).add(y)
    for w, v in info.items():
        for s in v["syn"]:
            link(w, s); link(s, w)
    try:
        sj = json.load(open(os.path.join(DATA, "synonyms.json"), encoding="utf8"))
        for g in sj["g"]:
            for x in g:
                for y in g:
                    link(x, y)
        for k, vs in sj["m"].items():
            for v in vs:
                link(k, v); link(v, k)
    except FileNotFoundError:
        pass

    # 2. 詞義向量
    from sentence_transformers import SentenceTransformer
    import numpy as np
    model = SentenceTransformer(a.model)
    def enc(words):
        return model.encode([info[w]["def"] for w in words], batch_size=128, normalize_embeddings=True, show_progress_bar=True)
    cvec = enc(cands)
    svec = enc(sources)
    clevel = np.array([tb[w] for w in cands])

    out = {}
    for i, w in enumerate(sources):
        slevel = tb.get(w, 99)             # 詞表沒有的成語視為最高級
        res, seen = [], set()
        for s in sorted(syn.get(w, ())):   # 辭典同義詞優先
            if s in tb and tb[s] < slevel and s not in seen:
                res.append([s, tb[s], "s", 100]); seen.add(s)
        sims = cvec @ svec[i]
        sim_of = {cands[j]: float(sims[j]) for j in range(len(cands))}
        def ok(c):
            if c in seen or c == w or tb.get(c, 99) >= slevel or w in c or c in w:
                return False
            pa, pb = info[w]["pos"], info[c]["pos"]
            return not (pa and pb and not (pa & pb))
        # d：釋義裡直接用到的較低等級詞
        text = info[w]["def"]
        mention = {text[k:k + n] for n in (2, 3, 4) for k in range(len(text) - n + 1)}
        dlist = sorted((c for c in mention if c in tb and c in sim_of and ok(c) and sim_of[c] >= 0.60), key=lambda c: -sim_of[c])
        for c in dlist[:3]:
            res.append([c, tb[c], "d", int(round(sim_of[c] * 100))]); seen.add(c)
        # e：詞義向量很接近的
        for j in np.argsort(-sims)[:40]:
            c = cands[j]
            if sims[j] < 0.82:
                break
            if ok(c):
                res.append([c, int(clevel[j]), "e", int(round(float(sims[j]) * 100))]); seen.add(c)
        res = res[:5]
        if res:
            out[w] = res
    out = postfilter(info, tb, out)
    json.dump(out, open(a.out, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    print("來源詞", len(sources), "有候選", len(out), "->", a.out)


if __name__ == "__main__":
    main()
