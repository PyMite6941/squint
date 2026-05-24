import os
from datetime import date
from supabase import create_client, Client

_client: Client | None = None

FREE_DAILY_LIMIT = 3
PAID_MONTHLY_LIMIT = 200


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _client


def get_user_from_jwt(jwt: str) -> dict:
    """Validate Supabase JWT and return the auth user."""
    result = get_client().auth.get_user(jwt)
    if not result or not result.user:
        raise ValueError("Invalid or expired token.")
    return result.user


def get_or_create_user_row(user_id: str, email: str) -> dict:
    sb = get_client()
    result = sb.table("users").select("*").eq("id", user_id).execute()
    if result.data:
        return result.data[0]
    sb.table("users").insert({
        "id": user_id,
        "email": email,
        "tier": "free",
        "daily_conversions_used": 0,
        "monthly_conversions_used": 0,
        "last_conversion_date": None,
        "last_month_reset": str(date.today()),
    }).execute()
    return get_client().table("users").select("*").eq("id", user_id).execute().data[0]


def check_and_consume(user_id: str, email: str) -> tuple[bool, int]:
    """Returns (allowed, remaining). Resets daily counter if it's a new day."""
    sb = get_client()
    row = get_or_create_user_row(user_id, email)
    today = str(date.today())
    tier = row["tier"]

    if tier == "paid":
        current_month = today[:7]  # YYYY-MM
        last_reset = (row.get("last_month_reset") or today)[:7]
        if current_month != last_reset:
            sb.table("users").update({
                "monthly_conversions_used": 0,
                "last_month_reset": today,
            }).eq("id", user_id).execute()
            row["monthly_conversions_used"] = 0

        used = row["monthly_conversions_used"]
        if used >= PAID_MONTHLY_LIMIT:
            return False, 0
        sb.table("users").update({
            "monthly_conversions_used": used + 1,
            "last_conversion_date": today,
        }).eq("id", user_id).execute()
        return True, PAID_MONTHLY_LIMIT - (used + 1)

    # Free tier — daily limit
    last_date = row.get("last_conversion_date")
    daily_used = row["daily_conversions_used"] if last_date == today else 0

    if daily_used >= FREE_DAILY_LIMIT:
        return False, 0

    sb.table("users").update({
        "daily_conversions_used": daily_used + 1,
        "last_conversion_date": today,
    }).eq("id", user_id).execute()
    return True, FREE_DAILY_LIMIT - (daily_used + 1)


def upgrade_user(email: str, subscription_id: str) -> None:
    sb = get_client()
    result = sb.table("users").select("id").eq("email", email).execute()
    if result.data:
        sb.table("users").update({
            "tier": "paid",
            "lemon_subscription_id": subscription_id,
        }).eq("email", email).execute()


def downgrade_user(subscription_id: str) -> None:
    get_client().table("users").update({"tier": "free"}).eq(
        "lemon_subscription_id", subscription_id
    ).execute()


def flag_payment_failed(subscription_id: str) -> None:
    get_client().table("users").update({"tier": "free"}).eq(
        "lemon_subscription_id", subscription_id
    ).execute()


def save_conversion(user_id: str, framework: str, code: str) -> None:
    get_client().table("conversions").insert({
        "user_id": user_id,
        "framework": framework,
        "code": code,
    }).execute()
