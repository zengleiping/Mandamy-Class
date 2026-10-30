#!/usr/bin/env python3
"""從近義詞工具書與教育部近義詞資料整理出「換詞用」的精簡資料 ../data/synonyms.json。
輸出 {"g": [[詞, 詞, ...], ...], "m": {詞: [近義詞, ...]}}。
  g：近義詞工具書（tools/synonyms/index.html 內嵌的詞組）每一組的詞
  m：教育部近義詞資料（tools/vocab/data/moe-relations.json）解析後的近義詞
用法：python3 build_synonyms.py"""
import json, re

def groups(path="../../synonyms/index.html"):
    t = open(path, encoding="utf8").read()
    m = re.search(r'<script id="entries-data" type="application/json">(.*?)</script>', t, re.S)
    out = []
    for e in json.loads(m.group(1)):
        ws = []
        for w in e.get("words", []):
            h = (w.get("h") or "").strip()
            if h and h not in ws: ws.append(h)
        if len(ws) >= 2: out.append(ws)
    return out

def moe(path="../../vocab/data/moe-relations.json"):
    d = json.load(open(path, encoding="utf8"))["entries"]
    out = {}
    for k, rows in d.items():
        for r in rows:
            s = r.get("synonym") or ""
            s = re.sub(r"\[[似反]\]", " ", s)
            s = re.sub(r"\d+\.", " ", s)
            for w in re.split(r"[\s、，,；;()（）]+", s):
                w = w.strip()
                if w and w != k and re.fullmatch(r"[㐀-鿿]+", w) and w not in out.get(k, []):
                    out.setdefault(k, []).append(w)
    return out

if __name__ == "__main__":
    g, m = groups(), moe()
    json.dump({"g": g, "m": m}, open("../data/synonyms.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    print("詞組", len(g), "教育部近義詞", len(m))
