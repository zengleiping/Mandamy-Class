#!/usr/bin/env python3
"""整理「國教院語料庫裡常見、但 TBCL 詞表沒有的詞」→ ../data/lexicon-freq.txt（每行一個詞）。
來源：COCT 通用詞頻表前 3 萬詞（語料庫本身就是國教院斷好詞的，所以這些都是「官方斷詞認得的詞」）。
規則：2–6 字、全漢字、不在 TBCL 詞表、也不在其他補充字典，而且「不能完全拆成 TBCL 詞」
      （很多＝很＋多、這些＝這＋些 是合成詞，不收；影音、法制、防線 這類詞表沒有的詞才收）。
用途：網頁版（沒有 CKIP）斷詞時，把「影音」當一個詞（詞表沒有），而不是切成「影」「音」再各自判斷。
用法：python3 build_freqlex.py"""
import os, re
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
tb = {l.split("\t")[0] for l in open(os.path.join(D, "tbcl.tsv"), encoding="utf8") if l[0] != "#"}
have = set()
for f in ("lexicon.txt", "lexicon-idioms.txt"):
    have |= set(open(os.path.join(D, f), encoding="utf8").read().split())


def decomposable(w):
    ok = [True] + [False] * len(w)
    for i in range(1, len(w) + 1):
        for j in range(max(0, i - 4), i):
            if ok[j] and w[j:i] in tb:
                ok[i] = True
                break
    return ok[len(w)]


out = []
for l in open(os.path.join(D, "freq.tsv"), encoding="utf8"):
    if l[0] == "#":
        continue
    w = l.split("\t")[0]
    if re.fullmatch(r"[㐀-鿿]{2,6}", w) and w not in tb and w not in have and not decomposable(w):
        out.append(w)
open(os.path.join(D, "lexicon-freq.txt"), "w", encoding="utf8").write("\n".join(out))
print(len(out))
