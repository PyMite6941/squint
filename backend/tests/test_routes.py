"""
Integration tests for FastAPI routes.
All external services (Groq, Supabase, Upstash) are mocked.
Run from squint/: pytest backend/tests/
"""
import base64
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

@pytest.fixture
def fake_user():
    user = MagicMock()
    user.id = "user-123"
    user.email = "test@example.com"
    return user


@pytest.fixture
def auth_header():
    return {"Authorization": "Bearer fake-jwt-token"}


@pytest.fixture
def client(fake_user):
    """TestClient with all external calls patched."""
    with (
        patch("backend.services.supabase_client.get_user_from_jwt", return_value=fake_user),
        patch("backend.services.supabase_client.get_or_create_user_row", return_value={
            "id": "user-123",
            "tier": "free",
            "daily_conversions_used": 0,
            "last_conversion_date": None,
            "monthly_conversions_used": 0,
            "last_month_reset": "2026-01-01",
        }),
        patch("backend.services.supabase_client.get_client"),
        patch("backend.services.ratelimit.get_redis"),
        patch("backend.services.ratelimit.check_rate_limit", return_value=True),
        patch("backend.services.supabase_client.check_and_consume", return_value=(True, 2)),
        patch("backend.services.supabase_client.save_conversion"),
        patch("backend.services.groq_client.image_to_code", return_value="export default function LoginPage() { return <main/>; }"),
    ):
        from backend.main import app
        yield TestClient(app)


# ------------------------------------------------------------------
# /health
# ------------------------------------------------------------------

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


# ------------------------------------------------------------------
# /convert
# ------------------------------------------------------------------

def small_b64():
    return base64.b64encode(b"\x89PNG\r\n" + b"\x00" * 100).decode()


def test_convert_success(client, auth_header):
    r = client.post("/convert", json={
        "image_b64": small_b64(),
        "mime_type": "image/png",
        "framework": "react",
    }, headers=auth_header)
    assert r.status_code == 200
    body = r.json()
    assert "code" in body
    assert "remaining" in body
    assert "LoginPage" in body["code"]


def test_convert_missing_auth(client):
    r = client.post("/convert", json={
        "image_b64": small_b64(),
        "mime_type": "image/png",
        "framework": "react",
    })
    assert r.status_code == 422  # Missing required header → Pydantic validation


def test_convert_bad_mime(client, auth_header):
    r = client.post("/convert", json={
        "image_b64": small_b64(),
        "mime_type": "application/pdf",
        "framework": "react",
    }, headers=auth_header)
    assert r.status_code == 400


def test_convert_paywall(fake_user, auth_header):
    # Patch at the route module's namespace (where the name is bound after import)
    with (
        patch("backend.routes.convert.get_user_from_jwt", return_value=fake_user),
        patch("backend.routes.convert.check_rate_limit", return_value=True),
        patch("backend.routes.convert.check_and_consume", return_value=(False, 0)),
        patch("backend.routes.convert.save_conversion"),
    ):
        from backend.main import app
        c = TestClient(app)
        r = c.post("/convert", json={
            "image_b64": small_b64(),
            "mime_type": "image/png",
            "framework": "react",
        }, headers=auth_header)
        assert r.status_code == 402


def test_convert_rate_limited(fake_user, auth_header):
    with (
        patch("backend.routes.convert.get_user_from_jwt", return_value=fake_user),
        patch("backend.routes.convert.check_rate_limit", return_value=False),
    ):
        from backend.main import app
        c = TestClient(app)
        r = c.post("/convert", json={
            "image_b64": small_b64(),
            "mime_type": "image/png",
            "framework": "react",
        }, headers=auth_header)
        assert r.status_code == 429


# ------------------------------------------------------------------
# /usage
# ------------------------------------------------------------------

def test_usage_free_tier(client, auth_header):
    r = client.get("/usage", headers=auth_header)
    assert r.status_code == 200
    body = r.json()
    assert body["tier"] == "free"
    assert body["limit"] == 3


def test_usage_no_auth(client):
    r = client.get("/usage")
    assert r.status_code == 422


# ------------------------------------------------------------------
# /history
# ------------------------------------------------------------------

def test_history_returns_list(client, auth_header):
    with patch("backend.routes.history.get_client") as mock_sb:
        mock_sb.return_value.table.return_value.select.return_value \
            .eq.return_value.order.return_value.limit.return_value \
            .execute.return_value.data = [
                {"id": "abc", "framework": "react", "code": "export default function X() {}", "created_at": "2026-04-28T10:00:00Z"},
            ]
        r = client.get("/history", headers=auth_header)
        assert r.status_code == 200
        assert len(r.json()["history"]) == 1


# ------------------------------------------------------------------
# /webhook/lemon
# ------------------------------------------------------------------

def test_webhook_subscription_created():
    with (
        patch("backend.services.supabase_client.upgrade_user"),
        patch("backend.services.supabase_client.get_client"),
    ):
        from backend.main import app
        c = TestClient(app)
        payload = {
            "meta": {"event_name": "subscription_created"},
            "data": {
                "id": "sub-1",
                "attributes": {"user_email": "buyer@example.com"},
            },
        }
        r = c.post("/webhook/lemon", json=payload, headers={"X-Signature": "ignored"})
        assert r.status_code == 200
        assert r.json() == {"ok": True}


def test_webhook_subscription_cancelled():
    with (
        patch("backend.routes.webhook.downgrade_user") as mock_down,
    ):
        from backend.main import app
        c = TestClient(app)
        payload = {
            "meta": {"event_name": "subscription_cancelled"},
            "data": {"id": "sub-1", "attributes": {}},
        }
        r = c.post("/webhook/lemon", json=payload, headers={"X-Signature": "ignored"})
        assert r.status_code == 200
        mock_down.assert_called_once_with("sub-1")
