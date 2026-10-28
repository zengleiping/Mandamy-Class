#!/usr/bin/env python3
"""把國家教育研究院 TBCL 官方 PDF／Excel 轉成工具用的資料檔（放到 ../data/）。
用法：python3 build_tbcl.py 詞語表.pdf 漢字表.pdf [通用詞頻表.xlsx]
  - 詞語表.pdf：臺灣華語文能力基準詞語表（第 1、1*、2、2*…7 級）
  - 漢字表.pdf：臺灣華語文能力基準漢字表
  - 通用詞頻表.xlsx：COCT 通用詞頻表（選填，只取前 30000 詞）
輸出：tbcl.tsv（詞<TAB>等級1-7<TAB>備註，* 級標成「*」）、hanzi.tsv（字<TAB>等級）、freq.tsv。
需要 pdftotext（poppler）與 openpyxl。"""
import re, subprocess, sys

def pdftext(p):
    return subprocess.run(["pdftotext", p, "-"], capture_output=True, text=True, check=True).stdout

HEAD = re.compile(r"第\s*(\d)\s*(\*?)\s*級\s*[（(]\s*(\d+)\s*[）)]")

def sections(text, expect_hanzi=False):
    text = text.replace("\f", "\n")
    out = {}
    key = None
    for ln in text.split("\n"):
        ln = ln.strip()
        m = HEAD.search(ln)
        if m and not expect_hanzi:
            key = (int(m.group(1)), m.group(2)); out[key] = {"n": int(m.group(3)), "t": ""}; continue
        if expect_hanzi:
            m2 = re.match(r"第\s*(\d)\s*(\*?)\s*級$", ln)
            if m2: key = (int(m2.group(1)), m2.group(2)); out[key] = {"n": 0, "t": ""}; continue
            m3 = re.match(r"漢字\s*[（(]\s*(\d+)\s*[）)]", ln)
            if m3 and key: out[key]["n"] = int(m3.group(1)); continue
        if key and ln and not re.fullmatch(r"\d+", ln) and "臺灣華語文能力基準" not in ln:
            out[key]["t"] += ln
    return out

def build_words(pdf):
    rows, warn = [], []
    for (lv, star), d in sorted(sections(pdftext(pdf)).items()):
        items = [x for x in re.split(r"[，,]", d["t"]) if x.strip()]
        got = 0
        for it in items:
            for v in it.split("/"):
                v = re.sub(r"\s+", "", v)
                v = re.sub(r"\d+$", "", v)           # 同形詞編號：和1、長2
                if v: rows.append((v, lv, "*" if star else "")); got += 1
        if len(items) != d["n"]: warn.append("第%d%s級：標題 %d 詞，解析 %d 項" % (lv, star, d["n"], len(items)))
    return rows, warn

def build_hanzi(pdf):
    rows, warn = [], []
    for (lv, star), d in sorted(sections(pdftext(pdf), True).items()):
        chars = [x for x in re.split(r"[，,\s]", d["t"]) if x]
        n = 0
        for c in chars:
            for v in c.split("／"):
                v = v.strip()
                if v: rows.append((v, lv)); n += 1
        if d["n"] and len(chars) != d["n"]: warn.append("漢字第%d%s級：標題 %d，解析 %d" % (lv, star, d["n"], len(chars)))
    return rows, warn

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(__doc__)
    w, ww = build_words(sys.argv[1]); h, hw = build_hanzi(sys.argv[2])
    best = {}
    for v, lv, s in w:
        if v not in best or lv < best[v][0]: best[v] = (lv, s)
    with open("../data/tbcl.tsv", "w", encoding="utf8") as f:
        f.write("# 臺灣華語文能力基準詞語表（國家教育研究院）；等級 1-7，備註「*」＝第 N* 級\n")
        for v, (lv, s) in best.items(): f.write("%s\t%d\t%s\n" % (v, lv, s))
    hb = {}
    for v, lv in h:
        if v not in hb or lv < hb[v]: hb[v] = lv
    with open("../data/hanzi.tsv", "w", encoding="utf8") as f:
        for v, lv in hb.items(): f.write("%s\t%d\n" % (v, lv))
    print("詞", len(best), "字", len(hb)); print("\n".join(ww + hw))
    if len(sys.argv) > 3:
        import openpyxl
        ws = openpyxl.load_workbook(sys.argv[3], read_only=True).worksheets[0]
        with open("../data/freq.tsv", "w", encoding="utf8") as f:
            f.write("# 詞<TAB>綜合序位<TAB>每百萬詞頻(平均)<TAB>書面<TAB>口語<TAB>新聞（COCT 通用詞頻表前 30000 詞）\n")
            for i, r in enumerate(ws.iter_rows(values_only=True)):
                if i == 0: continue
                if i > 30000: break
                f.write("%s\t%s\t%.1f\t%.1f\t%.1f\t%.1f\n" % (r[1], r[0], r[11] or 0, r[3] or 0, r[6] or 0, r[9] or 0))
