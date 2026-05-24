import hashlib
import hmac
import json
import os
from fastapi import APIRouter, Header, HTTPException, Request
from ..services.supabase_client import upgrade_user, downgrade_user, flag_payment_failed

router = APIRouter()

LEMON_SECRET = os.environ.get("LEMON_WEBHOOK_SECRET", "")


def _verify_signature(body: bytes, signature: str) -> bool:
    expected = hmac.new(LEMON_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook/lemon")
async def lemon_webhook(
    request: Request,
    x_signature: str = Header(alias="X-Signature"),
):
    body = await request.body()
    if LEMON_SECRET and not _verify_signature(body, x_signature):
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
