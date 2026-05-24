import sys
import io
import queue
import threading
import json
import os
import re
import time
import asyncio
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from crew import SquintCrew

ANSI_ESCAPE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_B64_SIZE = 5 * 1024 * 1024 * 4 // 3
MAX_RUNTIME = 600

_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173",
)
_CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(title="Squint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LineCapture(io.TextIOBase):
    def __init__(self, q: queue.Queue):
        self._q = q
        self._buf = ""

    def write(self, text: str) -> int:
        cleaned = ANSI_ESCAPE.sub("", text)
        self._buf += cleaned
        while "\n" in self._buf:
            line, self._buf = self._buf.split("\n", 1)
            stripped = line.strip()
            if stripped:
                self._q.put(stripped)
        return len(text)

    def flush(self):
        if self._buf.strip():
            self._q.put(self._buf.strip())
            self._buf = ""


class ConvertRequest(BaseModel):
    image_b64: str
    mime_type: str = "image/png"
    framework: str = "react"


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/convert")
async def convert(body: ConvertRequest):
    if body.mime_type not in ALLOWED_MIME:
        raise HTTPException(400, "Unsupported image type.")
    if len(body.image_b64) > MAX_B64_SIZE:
        raise HTTPException(400, "Image too large (max 5 MB).")

    async def event_stream():
        q: queue.Queue = queue.Queue()

        def run_crew():
            old_stdout, old_stderr = sys.stdout, sys.stderr
            capture = LineCapture(q)
            sys.stdout = capture
            sys.stderr = capture
            try:
                crew = SquintCrew(body.image_b64, body.mime_type, body.framework)
                code = crew.run()
                q.put({"__result__": json.dumps({"code": code})})
            except Exception as exc:
                capture.flush()
                import traceback
                q.put(f"[ERROR] {exc}")
                for line in traceback.format_exc().splitlines():
                    if line.strip():
                        q.put(f"[TRACE] {line}")
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr
                q.put(None)

        thread = threading.Thread(target=run_crew, daemon=True)
        thread.start()

        loop = asyncio.get_running_loop()
        deadline = time.monotonic() + MAX_RUNTIME

        while True:
            left = deadline - time.monotonic()
            if left <= 0:
                yield f"data: {json.dumps('[ERROR] Timed out.')}\n\n"
                yield f"data: {json.dumps('__DONE__')}\n\n"
                break
            try:
                item = await loop.run_in_executor(None, lambda: q.get(timeout=min(30, left)))
            except queue.Empty:
                yield ": ping\n\n"
                continue
            if item is None:
                yield f"data: {json.dumps('__DONE__')}\n\n"
                break
            if isinstance(item, dict) and "__result__" in item:
                yield f"data: {json.dumps({'type': 'result', 'content': item['__result__']})}\n\n"
            else:
                yield f"data: {json.dumps(item)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
