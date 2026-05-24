from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import JSONResponse
from ..services.supabase_client import get_user_from_jwt, get_client

router = APIRouter()


@router.get("/history")
async def get_history(
    authorization: str = Header(...),
    limit: int = Query(20, ge=1, le=50),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token.")
    jwt = authorization.removeprefix("Bearer ").strip()

    try:
        auth_user = get_user_from_jwt(jwt)
    except ValueError:
        raise HTTPException(401, "Invalid or expired token.")

    result = (
        get_client()
        .table("conversions")
        .select("id, framework, code, created_at")
        .eq("user_id", str(auth_user.id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return JSONResponse({"history": result.data})
