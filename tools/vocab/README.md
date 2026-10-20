# 生詞表製作（曼米中文 · 備課工具）

貼上生詞或整段課文，自動整理拼音／注音、詞性、英文意思與 TOCFL／HSK 級別，可加近義詞、反義詞、例句、挖空練習，匯出 Word、PPT、Google 簡報、CSV、字卡（Anki／Quizlet）、列印／PDF、複製表格。

原始工具：厭世華師教學筆記「生詞表製作」。曼米版保留所有功能與互動邏輯，只換成曼米的視覺風格，並改成可以嵌入教材頁的模組。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 工具頁面（可以直接開，也可以用 iframe 嵌入） |
| `vocab-tool.css` | 樣式：前半是原工具版面，最後是曼米視覺層與嵌入模式 |
| `vocab-tool.js` | 程式邏輯（語言引擎、生詞表、例句、匯出），最後一段是嵌入用的訊息介面 |
| `vocab-loader.js` | 先載入詞表資料再啟動工具 |
| `embed.js` | 嵌入小幫手：`MandamyVocab.mount()` |
| `data/` | `maps.json`（繁簡對照）、`tocfl.tsv`（華語八千詞）、`hsk.tsv`（HSK）、`cedict.txt`（英文詞典，背景載入）、`moe-relations.json`（教育部近反義詞，勾選時才載入） |
| `vendor/` | JSZip、PptxGenJS（MIT），放在本地，不依賴外部 CDN |

## 在平台裡

教材 → 選一課 → 「📖 生詞・語法・課文」右上角 **📋 生詞表製作**。打開時會自動帶入這一課的生詞（含老師填好的拼音、英文）。

## 嵌入到其他頁面（例如教材的生詞區域）

```html
<div id="vocab-tool"></div>
<script src="tools/vocab/embed.js"></script>
<script>
  var tool = MandamyVocab.mount(document.getElementById("vocab-tool"), {
    title: "第5課 天氣變涼了",
    words: [{ w: "溫度", p: "wēndù", m: "temperature" }, { w: "下雪" }]
  });
  // 換一課：tool.load("第6課 …", [{ w: "…" }]);
</script>
```

- 工具在 iframe 裡執行，樣式和程式不會跟外層頁面互相影響；高度會跟著內容自動調整（也可以傳 `height: 800` 固定高度）。
- 嵌入時（網址有 `?embed=1`）會隱藏工具自己的頁首、回平台連結和贊助按鈕，只留工具本身。
- 也可以直接用 iframe：`<iframe src="tools/vocab/?embed=1" style="width:100%;height:900px;border:0"></iframe>`，再用 `postMessage({ mmVocab: "load", title, words }, "*")` 傳生詞。工具準備好時會送出 `{ mmVocab: "ready" }`，內容高度改變時送出 `{ mmVocab: "height", h }`。

## 設定

在 `index.html` 載入前定義 `window.MMV_CONFIG` 可以覆蓋預設值：

| 設定 | 預設 | 說明 |
| --- | --- | --- |
| `data` | `data/` | 詞表資料夾 |
| `vendor` | `vendor/` | JSZip、PptxGenJS 位置 |
| `api` | `''` | 錯誤回報與使用統計的後端（結尾要有 `/`，例如 `https://example.com/tools/vocab/`）。留空時，錯誤回報改成「複製回報內容」，不做統計 |
| `brand` | `曼米中文 Mandamy` | 匯出檔案頁尾的品牌字樣 |
| `home` | `../../app.html` | 「回曼米平台」連結 |
| `manage` | `''` | 管理員登入連結（留空不顯示） |
| `sponsor` | 直接開啟時顯示、嵌入時不顯示 | 下載後的「請喝咖啡」邀請與右下角按鈕 |

## 資料來源與授權

- CC-CEDICT（MDBG，CC BY-SA 4.0）
- 華測會《華語八千詞表》2024 年 9 月版
- complete-hsk-vocabulary（MIT）
- 中華民國教育部《國語辭典簡編本》（版本 2014_20260929，CC BY-ND 3.0 TW）：近義詞、反義詞
- JSZip、PptxGenJS（MIT，授權檔在 `vendor/`）
