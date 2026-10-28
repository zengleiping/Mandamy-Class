#!/usr/bin/env python3
"""從教育部《重編國語辭典修訂本》整理成語／固定詞組字典 ../data/lexicon-idioms.txt（每行一個詞）。

來源：g0v/moedict-data 的 dict-revised.json（教育部重編國語辭典修訂本，CC 姓名標示-禁止改作 臺灣 3.0；
      教育部解釋：該限制針對文字內容本身，不限制格式轉換及後續應用。這裡只取詞條名稱，不改動辭典文字）。
條件：4~8 個字、全是漢字、不在 TBCL 詞語表，而且「不能完全拆成 TBCL 詞」
      （例如「社會秩序」＝社會＋秩序、「大學生」＝大學＋生 是合成詞，不收；「一心一意」「水洩不通」收）。
用法：
    curl -LO https://raw.githubusercontent.com/g0v/moedict-data/master/dict-revised.json.xz
    xz -dk dict-revised.json.xz
    python3 build_idioms.py dict-revised.json
"""
import json, re, sys

HAN = re.compile(r"^[㐀-鿿]+$")


def load_tbcl(path="../data/tbcl.tsv"):
    s = set()
    for ln in open(path, encoding="utf8"):
        if ln[0] != "#":
            s.add(ln.split("\t")[0])
    return s


def compositional(t, words):
    """t 能不能完全切成 ≥2 個 TBCL 詞，且其中至少一個詞是 2 字以上。"""
    n = len(t)
    best = [None] * (n + 1)          # best[i] = 切 t[:i] 的 (最少段數, 是否含多字詞)
    best[0] = (0, False)
    for i in range(1, n + 1):
        for j in range(max(0, i - 4), i):
            if best[j] is not None and t[j:i] in words:
                cand = (best[j][0] + 1, best[j][1] or (i - j) >= 2)
                if best[i] is None or cand[0] < best[i][0]:
                    best[i] = cand
    return best[n] is not None and best[n][0] >= 2 and best[n][1]


def main(path):
    words = load_tbcl()
    out = set()
    for e in json.load(open(path, encoding="utf8")):
        t = e.get("title", "")
        if 4 <= len(t) <= 8 and HAN.match(t) and t not in words and not compositional(t, words):
            out.add(t)
    open("../data/lexicon-idioms.txt", "w", encoding="utf8").write("\n".join(sorted(out)))
    print(len(out))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "dict-revised.json")
