from datetime import date
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from ..services.supabase_client import (
    get_user_from_jwt,
    get_or_create_user_row,
    FREE_DAILY_LIMIT,
    PAID_MONTHLY_LIMIT,
)

router = APIRouter()


@router.get("/usage")
async def usage(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token.")
    jwt = authorization.removeprefix("Bearer ").strip()

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

    return JSONResponse({
        "tier": tier,
        "used": used,
        "limit": limit,
        "remaining": max(0, limit - used),
    })
