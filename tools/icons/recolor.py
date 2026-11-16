#!/usr/bin/env python3
"""把平台的配色換成跟新圖示一致的配色（陶土橘、橄欖綠、赭黃、灰藍、磚紅、奶油米、暖灰褐外框）。
只換「精確相同」的舊色碼，不動插畫類檔案（寵物、遊戲背景主題、打貓咪的貓）。可重複執行（換過的不會再換）。
用法：python3 tools/icons/recolor.py [--dry]"""
import re, sys, glob, os, collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DRY = "--dry" in sys.argv

# 舊色碼 → 新色碼（大小寫不分）。註解寫的是這個顏色在網站裡的角色。
MAP = {
    # 主色（按鈕、重點）：亮蜜桃橘 → 陶土橘（白字對比 4.6:1，舊的只有 2.7:1）
    "#E8825A": "#B25F38", "#E8805A": "#B25F38",
    # 主色的深色（懸停、文字用）
    "#C0623A": "#8F4524", "#C4603A": "#8F4524", "#C4602A": "#8F4524",
    # 主色的淡底
    "#FBE8DE": "#F6E2D2", "#FDECE6": "#F6E2D2",
    # 副色：青綠 → 橄欖綠
    "#4C8577": "#647E58", "#E3F0EC": "#E5EBDA", "#4CAF6A": "#647E58", "#4C7A5E": "#4F6844", "#2D5A27": "#4F6844",
    # 頁面底色、面板底色：偏冷的米白 → 帶奶油的米色
    "#FAF7F2": "#F7F0E1", "#FAF3EA": "#F7F0E1", "#FAF4EC": "#F7F0E1", "#F2EAE0": "#EFE3CC", "#FBF7F1": "#FBF5E9", "#EDE3D6": "#E4D6BC",
    # 文字
    "#2B2320": "#352C27", "#2A2018": "#352C27", "#3A2A22": "#352C27", "#2B2622": "#352C27", "#1B1212": "#352C27", "#574C44": "#66594F",
    # 錯誤、危險：偏冷的紅 → 磚紅
    "#B23B32": "#A63B42", "#C0392B": "#A63B42",
    # 藍：亮藍 → 灰藍
    "#1E88E5": "#5A7590", "#2E75B6": "#5A7590", "#5F7BB0": "#5A7590",
    # 黃：亮黃 → 赭黃
    "#FFD23F": "#E3B25C", "#E9C25A": "#DCAC62", "#F2C14E": "#DCAC62", "#E0A82E": "#D09A3A",
    # 護眼模式（簡報頁）：綠灰 → 橄欖米
    "#E8EFE6": "#E8EDDD", "#F3F7F1": "#F3F6EA", "#DCE6D9": "#DDE4CD", "#243328": "#2E3A27", "#5C6B60": "#68745C",
    # 深色模式：冷黑棕 → 暖黑棕
    "#221C17": "#241E19", "#2C2520": "#2E2620", "#332A23": "#38302A",
    # 簡報頁的「藍」重點色底
    "#E3F2FD": "#E3EAF0", "#1A2E40": "#202D3A",
    # 狀態色的淡底與深色：粉紅 → 磚紅淡底；薄荷綠 → 橄欖淡底；綠色字 → 深橄欖；各種紅 → 磚紅
    "#F7D9D5": "#F4DEDC", "#FDECEA": "#F4DEDC", "#FBE5E2": "#F4DEDC",
    "#DCEEE6": "#E5EBDA", "#E3F1E8": "#E5EBDA", "#E3F4E4": "#E5EBDA", "#E3F0E6": "#E5EBDA",
    "#FBE3D6": "#F6E2D2", "#F6DCCF": "#F6E2D2", "#DCE8F6": "#E3EAF0",
    "#3E7D68": "#4F6844", "#4E7F6E": "#4F6844", "#2F7A45": "#4F6844", "#2E7D32": "#4F6844", "#256A2A": "#4F6844",
    "#E63946": "#A63B42", "#C62828": "#A63B42", "#9C3028": "#A63B42", "#E0564B": "#A63B42", "#D9534F": "#A63B42", "#E0524A": "#A63B42", "#8C2C25": "#8A2F36",
    "#9AD8A8": "#BFD0AE", "#EBDDD0": "#EFE3CC", "#F1E6DA": "#EFE3CC",
}
# rgba 的三原色（陰影、光暈、外框）
RGBA = [
    (re.compile(r"rgba\(\s*232\s*,\s*130\s*,\s*90\s*,"), "rgba(178,95,56,"),
    (re.compile(r"rgba\(\s*43\s*,\s*35\s*,\s*32\s*,"), "rgba(73,66,61,"),
    (re.compile(r"rgba\(\s*28\s*,\s*33\s*,\s*30\s*,"), "rgba(73,66,61,"),
]
# 平台介面檔案（不含寵物、遊戲背景主題、打貓咪等插畫）
FILES = ["app.html", "index.html", "tts.html", "cam.html", "slides/practice.html", "games/games.css", "games/index.html"] + \
    [f for f in glob.glob(os.path.join(ROOT, "games/*.js")) if os.path.basename(f) not in ("themes.js", "whack.js", "cards.js", "music.js")] + \
    glob.glob(os.path.join(ROOT, "classtools/ct-*.js")) + \
    [f for f in glob.glob(os.path.join(ROOT, "tools/*/*")) if f.endswith((".html", ".css", ".js")) and "/vendor/" not in f and "/data/" not in f]
files = []
for f in FILES:
    p = f if os.path.isabs(f) else os.path.join(ROOT, f)
    if os.path.exists(p) and p not in files: files.append(p)

pat = re.compile("|".join(re.escape(k) + r"(?![0-9A-Fa-f])" for k in MAP), re.I)
up = {k.upper(): v for k, v in MAP.items()}
total = collections.Counter(); per = {}
for p in files:
    s = open(p, encoding="utf-8").read(); n = 0
    def sub(m):
        global n
        n += 1; total[m.group(0).upper()] += 1
        return up[m.group(0).upper()]
    s2 = pat.sub(sub, s)
    for rx, rep in RGBA:
        s2, k = rx.subn(rep, s2); n += k
    if s2 != s:
        per[os.path.relpath(p, ROOT)] = n
        if not DRY: open(p, "w", encoding="utf-8").write(s2)
print(("（試跑，沒有寫入）" if DRY else "已寫入"), "共換了", sum(per.values()), "處，", len(per), "個檔案")
for f, n in sorted(per.items(), key=lambda x: -x[1]): print(f"  {n:4d}  {f}")
print("前 12 名被換掉的顏色：", ", ".join(f"{c}×{n}" for c, n in total.most_common(12)))
