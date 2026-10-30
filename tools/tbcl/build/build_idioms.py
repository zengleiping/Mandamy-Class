#!/usr/bin/env python3
"""從教育部《重編國語辭典修訂本》整理成語／固定詞組字典 ../data/lexicon-idioms.txt（每行一個詞）。

來源：g0v/moedict-data 的 dict-revised.json（教育部重編國語辭典修訂本，CC 姓名標示-禁止改作 臺灣 3.0；
      教育部解釋：該限制針對文字內容本身，不限制格式轉換及後續應用。這裡只取詞條名稱，不改動辭典文字）。
補充來源（選用，--xinhua）：pwxcoo/chinese-xinhua 的 idiom.json（約 3 萬成語，簡體，MIT 授權），
      用 OpenCC s2twp 轉成臺灣繁體後併入（教育部辭典沒收的，例如「落英繽紛」「小橋流水」）。
條件：4~8 個字、全是漢字、不在 TBCL 詞語表，而且「不能完全拆成 TBCL 詞」
      （例如「社會秩序」＝社會＋秩序、「大學生」＝大學＋生 是合成詞，不收；「一心一意」「水洩不通」收）。
用法：
    pip install opencc-python-reimplemented   # 只有用 --xinhua 時需要
    curl -LO https://raw.githubusercontent.com/g0v/moedict-data/master/dict-revised.json.xz
    xz -dk dict-revised.json.xz
    python3 build_idioms.py dict-revised.json [--xinhua idiom.json]
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
    """是不是「合成詞」：4 字能拆成兩個 2 字 TBCL 詞（社會秩序＝社會＋秩序），3 字能拆成 1＋2／2＋1。
    其他（包含「落英繽紛」這種有一半不在詞表的）都當作成語／固定詞組。"""
    n = len(t)
    if n == 4:
        return t[:2] in words and t[2:] in words
    if n == 3:
        return (t[0] in words and t[1:] in words) or (t[:2] in words and t[2] in words)
    return False


def main(path, xinhua=None):
    words = load_tbcl()
    out = set()
    for e in json.load(open(path, encoding="utf8")):
        t = e.get("title", "")
        if 4 <= len(t) <= 8 and HAN.match(t) and t not in words and not compositional(t, words):
            out.add(t)
    n_moe = len(out)
    if xinhua:
        from opencc import OpenCC
        cc = OpenCC("s2twp")
        for e in json.load(open(xinhua, encoding="utf8")):
            t = cc.convert(e["word"])
            if 4 <= len(t) <= 8 and HAN.match(t) and t not in words and not compositional(t, words):
                out.add(t)
    open("../data/lexicon-idioms.txt", "w", encoding="utf8").write("\n".join(sorted(out)))
    print("辭典", n_moe, "合計", len(out))


if __name__ == "__main__":
    args = sys.argv[1:]
    xin = args[args.index("--xinhua") + 1] if "--xinhua" in args else None
    main(next((a for a in args if a.endswith(".json") and a != xin), "dict-revised.json"), xin)
