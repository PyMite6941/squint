import base64
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ..services.groq_client import image_to_code
from ..services.supabase_client import get_user_from_jwt, check_and_consume, save_conversion
from ..services.ratelimit import check_rate_limit

router = APIRouter()

ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_B64_SIZE = 5 * 1024 * 1024 * 4 // 3  # ~5 MB decoded ceiling


class ConvertRequest(BaseModel):
    image_b64: str
    mime_type: str = "image/png"
    framework: str = "react"


@router.post("/convert")
async def convert(
    body: ConvertRequest,
    authorization: str = Header(...),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token.")
    jwt = authorization.removeprefix("Bearer ").strip()

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

    code = image_to_code(body.image_b64, body.mime_type)
    save_conversion(user_id, body.framework, code)
    return JSONResponse({"code": code, "remaining": remaining})
