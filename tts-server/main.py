"""曼米中文 TTS 後端：用 edge-tts（微軟 Edge 免費語音）產生台灣華語 MP3。

路由
  GET  /health            健康檢查
  GET  /api/voices        可用的 zh-TW 語音清單
  POST /api/tts           {text, rate(0.7~1.2), voice?}  ->  audio/mpeg
  GET  /api/tts?text=...&rate=1.0&voice=...              ->  audio/mpeg（方便直接當 <audio src> 用）

同樣的 文字+語速+語音 會快取成檔案，聽力測驗反覆播放不會重複呼叫微軟。
"""
import hashlib
import os
import re
from pathlib import Path

import edge_tts
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

DEFAULT_VOICE = "zh-TW-HsiaoChenNeural"  # 曉臻（女）
ALLOWED_VOICES = {
    "zh-TW-HsiaoChenNeural": "曉臻（女）",
    "zh-TW-HsiaoYuNeural": "曉雨（女）",
    "zh-TW-YunJheNeural": "雲哲（男）",
}
MAX_CHARS = 3000
CACHE_DIR = Path(os.environ.get("TTS_CACHE_DIR", "/tmp/mandamy-tts-cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# 允許呼叫的網站；預設只開給 GitHub Pages 與本機測試。可用環境變數 TTS_ALLOW_ORIGINS（逗號分隔）覆蓋，"*" 代表全開。
_origins = os.environ.get(
    "TTS_ALLOW_ORIGINS",
    "https://zengleiping.github.io,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8123,http://127.0.0.1:8123",
)
ORIGINS = [o.strip() for o in _origins.split(",") if o.strip()]

app = FastAPI(title="Mandamy TTS")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class TtsReq(BaseModel):
    text: str = Field(..., min_length=1)
    rate: float = 1.0
    voice: str = DEFAULT_VOICE


def rate_str(rate: float) -> str:
    rate = max(0.7, min(1.2, float(rate)))
    pct = round((rate - 1.0) * 100)
    return f"{pct:+d}%"


async def synth(text: str, rate: float, voice: str) -> Path:
    text = re.sub(r"[ \t　]+", " ", text).strip()
    if not text:
        raise HTTPException(400, "沒有文字")
    if len(text) > MAX_CHARS:
        raise HTTPException(413, f"文字太長（上限 {MAX_CHARS} 字）")
    if voice not in ALLOWED_VOICES:
        voice = DEFAULT_VOICE
    rs = rate_str(rate)
    key = hashlib.sha256(f"{voice}|{rs}|{text}".encode("utf-8")).hexdigest()[:40]
    path = CACHE_DIR / f"{key}.mp3"
    if path.exists() and path.stat().st_size > 0:
        return path
    tmp = path.with_suffix(".part")
    try:
        await edge_tts.Communicate(text, voice, rate=rs).save(str(tmp))
        if not tmp.exists() or tmp.stat().st_size == 0:
            raise RuntimeError("empty audio")
        tmp.replace(path)
    except HTTPException:
        raise
    except Exception as e:  # 微軟端暫時失敗時回 502，前端會退回瀏覽器語音
        tmp.unlink(missing_ok=True)
        raise HTTPException(502, f"語音產生失敗：{e}")
    return path


@app.get("/health")
async def health():
    return {"ok": True, "voice": DEFAULT_VOICE}


@app.get("/api/voices")
async def voices():
    return [{"id": k, "name": v} for k, v in ALLOWED_VOICES.items()]


@app.post("/api/tts")
async def tts_post(req: TtsReq):
    path = await synth(req.text, req.rate, req.voice)
    return FileResponse(path, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/api/tts")
async def tts_get(text: str = Query(..., min_length=1), rate: float = 1.0, voice: str = DEFAULT_VOICE):
    path = await synth(text, rate, voice)
    return FileResponse(path, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400"})
