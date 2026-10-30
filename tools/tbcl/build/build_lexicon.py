#!/usr/bin/env python3
"""整理「詞表沒有、但確實是詞」的補充斷詞字典 ../data/lexicon.txt（每行一個詞）。
來源：教育部近義詞資料的詞條（tools/vocab/data/moe-relations.json），只收 3 字以上且不在 TBCL 詞語表的詞（成語、慣用語、較長的詞）。
用途：斷詞時當成一個詞，等級檢核時標成「詞表沒有」，行為接近官方系統的 X。
用法：python3 build_lexicon.py"""
import json, re
tb = set()
for ln in open("../data/tbcl.tsv", encoding="utf8"):
    if ln[0] != "#": tb.add(ln.split("\t")[0])
moe = json.load(open("../../vocab/data/moe-relations.json", encoding="utf8"))["entries"]
ws = sorted(k for k in moe if len(k) >= 3 and k not in tb and re.fullmatch(r"[㐀-鿿]+", k))
open("../data/lexicon.txt", "w", encoding="utf8").write("\n".join(ws))
print(len(ws))
