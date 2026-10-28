#!/usr/bin/env python3
"""把 TBCL 語法點表 PDF 轉成 ../data/grammar.json（每筆：等級、是否 * 級、序號、語法點名稱、例句）。
用法：python3 build_grammar.py 語法點表.pdf   （需要 pdfplumber）
依欄位位置切欄、依序號的垂直位置切列；只涵蓋 PDF 內有的等級（官方語法點表目前是第 1–5 級）。"""
import json, re, sys, pdfplumber

def parse(path):
    out, lv = [], None
    with pdfplumber.open(path) as pdf:
        for pg in pdf.pages:
            words = pg.extract_words(keep_blank_chars=False, use_text_flow=False)
            txt = pg.extract_text() or ""
            for m in re.finditer(r"第\s*(\d)\s*(\*?)\s*級", txt): lv = (int(m.group(1)), m.group(2))
            hdr = {w["text"]: w for w in words if w["text"] in ("序號", "語法點名稱", "語法點例句")}
            if "語法點名稱" not in hdr or "語法點例句" not in hdr or lv is None: continue
            x_name, x_ex = hdr["語法點名稱"]["x0"] - 18, hdr["語法點例句"]["x0"] - 18
            top = max(w["bottom"] for w in hdr.values())
            body = [w for w in words if w["top"] >= top - 1]
            seqs = sorted([w for w in body if w["x0"] < x_name and re.fullmatch(r"\d+\.?", w["text"])], key=lambda w: w["top"])
            if not seqs: continue
            cy = [(s["top"] + s["bottom"]) / 2 for s in seqs]
            bounds = [top] + [(cy[i] + cy[i + 1]) / 2 for i in range(len(cy) - 1)] + [pg.height]
            for i, s in enumerate(seqs):
                row = [w for w in body if bounds[i] <= (w["top"] + w["bottom"]) / 2 < bounds[i + 1]]
                def col(a, b):
                    ws = sorted([w for w in row if a <= w["x0"] < b], key=lambda w: (round(w["top"] / 3), w["x0"]))
                    return "".join(w["text"] for w in ws)
                out.append({"lv": lv[0], "star": lv[1] == "*", "no": int(s["text"].strip(".")), "name": col(x_name, x_ex), "ex": col(x_ex, 9999)})
    return out

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    g = parse(sys.argv[1])
    json.dump(g, open("../data/grammar.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    from collections import Counter
    print(len(g), sorted(Counter((x["lv"], x["star"]) for x in g).items()))
