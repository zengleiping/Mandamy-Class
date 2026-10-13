# 曼米中文 TTS 後端（edge-tts）

產生台灣華語（預設 曉臻 `zh-TW-HsiaoChenNeural`）MP3，給 `tts.html` 播放與下載。免費、不需要 API Key。

## 本機執行（最簡單，老師自己的電腦就能用）
```bash
cd tts-server
python -m venv .venv && source .venv/bin/activate   # Windows：.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```
然後打開平台的 `tts.html`，右上「⚙ 語音伺服器」填入 `http://127.0.0.1:8000`。

> 注意：網頁是 https（GitHub Pages）時，瀏覽器允許連到 `http://127.0.0.1` / `http://localhost`，但不允許連到其他 http 網址。要給學生端用，請部署成 https（見下）。

## 部署成網址（學生端也能播）
任何能跑 Docker 或 Python 的免費／低價主機皆可，例如 Render、Railway、Fly.io：
1. 把本專案連到主機，Root Directory 設 `tts-server`，使用 `Dockerfile`（或啟動指令 `uvicorn main:app --host 0.0.0.0 --port $PORT`）。
2. 部署完成會得到 `https://xxxx.onrender.com`，開 `/health` 應看到 `{"ok":true,...}`。
3. 到 `tts.html` 的「⚙ 語音伺服器」貼上這個網址。
4. 若網站網域不是 `zengleiping.github.io`，設定環境變數 `TTS_ALLOW_ORIGINS`（逗號分隔，例如 `https://xxx.github.io`）。

免費方案閒置後會休眠，第一次呼叫可能要等 30–60 秒；正式考試前先開一次 `/health` 暖機，並先把音檔下載存起來（見下）。

## API
| 路由 | 說明 |
|---|---|
| `GET /health` | 健康檢查 |
| `GET /api/voices` | 可選語音 |
| `POST /api/tts` | JSON `{"text":"…","rate":0.9,"voice":"zh-TW-HsiaoChenNeural"}` → `audio/mpeg` |
| `GET /api/tts?text=…&rate=1.0` | 同上，可直接放在 `<audio src>` |

- `rate` 範圍 0.7～1.2（伺服器會強制限制）。單次上限 3000 字。
- 相同「文字＋語速＋語音」會快取，反覆播放不會重複呼叫微軟。

## 重要提醒
- edge-tts 使用微軟 Edge 的線上朗讀服務（非官方公開 API），穩定性與使用條款由微軟決定。重要的聽力考題請先產生 MP3 **下載存檔**，再當作媒體檔上傳到題目，不要考試當下才即時合成。
