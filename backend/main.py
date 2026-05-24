import sys
import io
import queue
import threading
import json
import os
import re
import time
import asyncio
import hashlib
import hmac
from datetime import date
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from crew import SquintCrew
from supabase_client import (
    get_user_from_jwt,
    get_or_create_user_row,
    check_and_consume,
    save_conversion,
    upgrade_user,
    downgrade_user,
    flag_payment_failed,
    get_client as get_supabase,
    FREE_DAILY_LIMIT,
    PAID_MONTHLY_LIMIT,
)
ANSI_ESCAPE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_B64_SIZE = 5 * 1024 * 1024 * 4 // 3
MAX_RUNTIME = 600
LEMON_SECRET = os.environ.get("LEMON_WEBHOOK_SECRET", "")

# Rate limiting is optional — if Upstash env vars aren't set, skip it.
_UPSTASH_CONFIGURED = bool(os.environ.get("UPSTASH_REDIS_REST_URL"))
if _UPSTASH_CONFIGURED:
    from ratelimit import check_rate_limit
else:
    def check_rate_limit(_user_id: str) -> bool:
        return True

# CORS: comma-separated list in ALLOWED_ORIGINS env var, or fallback to dev defaults.
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173,https://squint.app",
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


def _extract_jwt(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token.")
    return authorization.removeprefix("Bearer ").strip()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/convert")
async def convert(body: ConvertRequest, authorization: str = Header(...)):
    jwt = _extract_jwt(authorization)
    try:
        auth_user = get_user_from_jwt(jwt)
    except ValueError:
        raise HTTPException(401, "Invalid or expired token.")

    user_id = str(auth_user.id)
    email = auth_user.email or ""

    if body.mime_type not in ALLOWED_MIME:
        raise HTTPException(400, "Unsupported image type.")
    if len(body.image_b64) > MAX_B64_SIZE:
        raise HTTPException(400, "Image too large (max 5 MB).")
    if not check_rate_limit(user_id):
        raise HTTPException(429, "Too many requests. Slow down.")

    allowed, remaining = check_and_consume(user_id, email)
    if not allowed:
        raise HTTPException(402, "Conversion limit reached. Upgrade to Pro.")

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
                save_conversion(user_id, body.framework, code)
                q.put({"__result__": json.dumps({"code": code, "remaining": remaining})})
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
                yield f"data: {json.dumps('[ERROR] Analysis timed out.')}\n\n"
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


@app.get("/usage")
async def usage(authorization: str = Header(...)):
    jwt = _extract_jwt(authorization)
    try:
        auth_user = get_user_from_jwt(jwt)
    except ValueError:
        raise HTTPException(401, "Invalid or expired token.")

    row = get_or_create_user_row(str(auth_user.id), auth_user.email or "")
    tier = row["tier"]
    today = str(date.today())

    if tier == "paid":
        used = row["monthly_conversions_used"]
        limit = PAID_MONTHLY_LIMIT
    else:
        last_date = row.get("last_conversion_date")
        used = row["daily_conversions_used"] if last_date == today else 0
        limit = FREE_DAILY_LIMIT

    return JSONResponse({"tier": tier, "used": used, "limit": limit, "remaining": max(0, limit - used)})


@app.get("/history")
async def get_history(authorization: str = Header(...), limit: int = Query(20, ge=1, le=50)):
    jwt = _extract_jwt(authorization)
    try:
        auth_user = get_user_from_jwt(jwt)
    except ValueError:
        raise HTTPException(401, "Invalid or expired token.")

    result = (
        get_supabase()
        .table("conversions")
        .select("id, framework, code, created_at")
        .eq("user_id", str(auth_user.id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return JSONResponse({"history": result.data})


@app.post("/webhook/lemon")
async def lemon_webhook(request: Request, x_signature: str = Header(alias="X-Signature")):
    body = await request.body()
    if LEMON_SECRET:
        expected = hmac.new(LEMON_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_signature):
            raise HTTPException(401, "Invalid signature.")

    payload = json.loads(body)
    event = payload.get("meta", {}).get("event_name", "")
    attrs = payload.get("data", {}).get("attributes", {})
    email = attrs.get("user_email", "")
    subscription_id = str(payload.get("data", {}).get("id", ""))

    if event in ("order_created", "subscription_created", "subscription_resumed"):
        if email:
            upgrade_user(email, subscription_id)
    elif event == "subscription_cancelled":
        if subscription_id:
            downgrade_user(subscription_id)
    elif event == "subscription_payment_failed":
        if subscription_id:
            flag_payment_failed(subscription_id)

    return {"ok": True}
