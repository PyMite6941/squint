import sys
import io
import queue
import threading
import json
import os
import re
import time
import hmac
import hashlib
import base64
import asyncio
from dotenv import load_dotenv
load_dotenv()

import httpx
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from crew import SquintCrew

# ── Constants ─────────────────────────────────────────────────────────────────
ANSI_ESCAPE   = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
ALLOWED_MIME  = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_B64_SIZE  = 5 * 1024 * 1024 * 4 // 3
MAX_RUNTIME   = 600
FREE_LIMIT    = 3
TOKEN_TTL     = 900   # 15 minutes
BASE_RPC      = "https://mainnet.base.org"
RECIPIENT     = "0x8069408a17b77895cb7cd0b0d804ab46f59bc4c3"  # lowercase for comparison
PRICE_WEI_MIN = int(1.98e15)  # 0.00198 ETH — 1% slippage tolerance on 0.002 ETH

# ── Config ────────────────────────────────────────────────────────────────────
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173")
_CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

PAYMENT_SECRET  = os.environ.get("PAYMENT_SECRET", "")
PAYMENT_ENABLED = bool(PAYMENT_SECRET)

if not PAYMENT_ENABLED:
    print("[WARNING] PAYMENT_SECRET not set — payment enforcement disabled (dev mode)", flush=True)

# ── State (in-memory, resets on restart) ─────────────────────────────────────
_used_tx_hashes: set[str] = set()
_used_tx_lock   = threading.Lock()

_ip_usage: dict[str, dict] = {}
_ip_lock  = threading.Lock()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Squint API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


def _get_month() -> str:
    return time.strftime("%Y-%m")


def _try_consume_free(ip: str) -> bool:
    """Atomically checks and consumes one free slot. Returns False if limit reached."""
    month = _get_month()
    with _ip_lock:
        rec = _ip_usage.get(ip, {"month": "", "count": 0})
        if rec["month"] != month:
            rec = {"month": month, "count": 0}
        if rec["count"] >= FREE_LIMIT:
            _ip_usage[ip] = rec
            return False
        rec["count"] += 1
        _ip_usage[ip] = rec
        return True


def _mint_token(tx_hash: str) -> str:
    payload = json.dumps({"tx": tx_hash, "exp": int(time.time()) + TOKEN_TTL}, separators=(",", ":"))
    sig = hmac.new(PAYMENT_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(payload.encode()).decode() + "." + sig


def _redeem_token(token: str) -> str | None:
    """Verifies HMAC + expiry. Returns tx_hash if valid, None otherwise."""
    try:
        encoded, sig = token.rsplit(".", 1)
        payload = base64.urlsafe_b64decode(encoded).decode()
        expected = hmac.new(PAYMENT_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(payload)
        if data["exp"] < time.time():
            return None
        return data["tx"]
    except Exception:
        return None


async def _verify_tx_on_chain(tx_hash: str) -> bool:
    """Checks Base RPC: tx confirmed, recipient correct, value >= minimum."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            receipt_res = await client.post(BASE_RPC, json={
                "jsonrpc": "2.0", "method": "eth_getTransactionReceipt",
                "params": [tx_hash], "id": 1,
            })
            receipt = receipt_res.json().get("result")
            if not receipt or receipt.get("status") != "0x1":
                return False
            if receipt.get("to", "").lower() != RECIPIENT:
                return False

            tx_res = await client.post(BASE_RPC, json={
                "jsonrpc": "2.0", "method": "eth_getTransactionByHash",
                "params": [tx_hash], "id": 2,
            })
            tx = tx_res.json().get("result") or {}
            value_wei = int(tx.get("value", "0x0"), 16)
            return value_wei >= PRICE_WEI_MIN
    except Exception:
        return False


class LineCapture(io.TextIOBase):
    def __init__(self, q: queue.Queue):
        self._q   = q
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


# ── Request models ────────────────────────────────────────────────────────────

class ConvertRequest(BaseModel):
    image_b64: str
    mime_type: str = "image/png"
    framework: str = "react"


class VerifyPaymentRequest(BaseModel):
    tx_hash: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True, "payment_enabled": PAYMENT_ENABLED}


@app.post("/verify-payment")
async def verify_payment(body: VerifyPaymentRequest):
    if not PAYMENT_ENABLED:
        raise HTTPException(503, "Payment system not configured on this server.")

    tx_hash = body.tx_hash.strip().lower()
    if not re.fullmatch(r"0x[0-9a-f]{64}", tx_hash):
        raise HTTPException(400, "Invalid transaction hash format.")

    with _used_tx_lock:
        if tx_hash in _used_tx_hashes:
            raise HTTPException(400, "Transaction already used for a conversion.")

    ok = await _verify_tx_on_chain(tx_hash)
    if not ok:
        raise HTTPException(402, "Transaction not verified — wrong recipient, insufficient amount, or not confirmed on Base.")

    token = _mint_token(tx_hash)
    return {"token": token}


@app.post("/convert")
async def convert(
    body: ConvertRequest,
    request: Request,
    x_payment_token: str | None = Header(default=None),
):
    if body.mime_type not in ALLOWED_MIME:
        raise HTTPException(400, "Unsupported image type.")
    if len(body.image_b64) > MAX_B64_SIZE:
        raise HTTPException(400, "Image too large (max 5 MB).")

    if PAYMENT_ENABLED:
        if x_payment_token:
            tx_hash = _redeem_token(x_payment_token)
            if tx_hash is None:
                raise HTTPException(402, "Invalid or expired payment token.")
            with _used_tx_lock:
                if tx_hash in _used_tx_hashes:
                    raise HTTPException(402, "Payment token already used.")
                _used_tx_hashes.add(tx_hash)
        else:
            client_ip = _get_client_ip(request)
            if not _try_consume_free(client_ip):
                raise HTTPException(402, "Free limit reached. Payment required.")

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

        loop     = asyncio.get_running_loop()
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
