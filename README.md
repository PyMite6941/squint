# Squint — Screenshot to Code

> Upload a screenshot of any UI. Get clean React + Tailwind code back in under 3 seconds.

**Stack:** Vite + React + TypeScript · FastAPI · Groq (Llama 4 Scout) · Supabase · Upstash Redis · Lemon Squeezy

---

## What it does

Squint converts UI screenshots into production-ready React components with Tailwind CSS. Drop a screenshot of a login page, a pricing card, a hero section — get code you can paste straight into your project.

- **Live preview** — see the output rendered before you copy it
- **Four output formats** — React TSX, Vue 3 SFC, Tailwind HTML, plain HTML/CSS
- **Download or copy** — one click
- **Conversion history** — Pro users get a full log of past conversions
- **3 free conversions/day** — no credit card required

---

## Running locally

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in all keys
uvicorn backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in Supabase + Lemon Squeezy keys
npm run dev
```

Frontend proxies `/api/*` → `http://localhost:8000` via Vite config.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | console.groq.com |
| `SUPABASE_URL` | Supabase project settings |
| `SUPABASE_SERVICE_KEY` | Supabase project settings → service_role key |
| `UPSTASH_REDIS_REST_URL` | console.upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | console.upstash.com |
| `LEMON_WEBHOOK_SECRET` | Lemon Squeezy → Webhooks → signing secret |

### Frontend (`frontend/.env`)

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings → anon key |
| `VITE_LEMON_CHECKOUT_URL` | Lemon Squeezy → Products → your variant checkout URL |

---

## Supabase setup

Run these in the Supabase SQL editor:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  tier text not null default 'free' check (tier in ('free', 'paid')),
  daily_conversions_used int not null default 0,
  last_conversion_date date,
  monthly_conversions_used int not null default 0,
  last_month_reset date default current_date,
  lemon_subscription_id text,
  created_at timestamptz default now()
);

create table conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  framework text not null,
  code text not null,
  created_at timestamptz default now()
);

create index on conversions (user_id, created_at desc);
```

Enable Row Level Security and add a policy that allows the service role to read/write both tables (the backend uses the service key, so RLS won't block it).

---

## Testing the prompt

Before shipping, run the prompt against test screenshots:

```bash
cd backend
# Add PNG screenshots to test_screenshots/
GROQ_API_KEY=gsk_... python test_prompt.py
# Review .tsx files in test_outputs/
```

Target: 7+ out of 10 produce usable code. See `ideas.md` for the full iteration playbook.

---

## Deployment

**Backend → Render:**
- Connect the repo, set root to `squint/`
- Render reads `backend/render.yaml` automatically
- Add all env vars in Render dashboard

**Frontend → Vercel:**
- Import the repo, set root directory to `squint/frontend`
- Add env vars in Vercel dashboard
- Builds with `npm run build`, serves `dist/`

**After deploy:**
- Set up UptimeRobot to ping `https://your-api.onrender.com/health` every 10 min (prevents Render free-tier cold starts)
- Add your production frontend URL to `allow_origins` in `backend/main.py`

---

## Lemon Squeezy webhooks

Point the webhook to `https://your-api.onrender.com/webhook/lemon`. Subscribe to:
- `subscription_created`
- `subscription_cancelled`
- `subscription_payment_failed`
- `subscription_resumed`

The backend verifies the HMAC signature on every event.
