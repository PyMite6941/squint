squint/
├── frontend/ # Vite + React app
│ ├── src/
│ │ ├── App.tsx
│ │ ├── pages/
│ │ │ ├── Landing.tsx
│ │ │ ├── App.tsx # The product page
│ │ │ ├── Pricing.tsx
│ │ │ └── Docs.tsx
│ │ ├── components/
│ │ │ ├── UploadZone.tsx
│ │ │ ├── CodeViewer.tsx
│ │ │ ├── FrameworkPicker.tsx
│ │ │ ├── PaywallModal.tsx
│ │ │ └── ui/ # shadcn components
│ │ ├── lib/
│ │ │ ├── api.ts # Calls your FastAPI backend
│ │ │ └── supabase.ts
│ │ └── main.tsx
│ ├── index.html
│ ├── tailwind.config.js
│ ├── vite.config.ts
│ └── package.json
│
├── backend/ # FastAPI app
│ ├── main.py # FastAPI app entry
│ ├── routes/
│ │ ├── convert.py # POST /convert — screenshot to code
│ │ ├── webhook.py # POST /webhook/lemon
│ │ └── usage.py # GET /usage
│ ├── services/
│ │ ├── groq_client.py # Groq API wrapper
│ │ ├── prompts.py # The system prompt (secret sauce)
│ │ ├── supabase_client.py
│ │ └── ratelimit.py # Upstash Redis logic
│ ├── requirements.txt
│ └── render.yaml # Render deployment config
│
└── README.md

# Squint — Full Build Plan

> A weekend-sprint paid SaaS that turns UI screenshots into React + Tailwind code.
> Stack: Vite frontend + FastAPI backend + Groq (Llama 4 Scout) + Supabase + Lemon Squeezy.

---

## Table of contents

1. [Product definition](#product-definition)
2. [Tech stack](#tech-stack)
3. [Architecture flow](#architecture-flow)
4. [File structure](#file-structure)
5. [Day-by-day plan](#day-by-day-plan)
6. [The system prompt](#the-system-prompt)
7. [Defensive output cleaning](#defensive-output-cleaning)
8. [Testing harness](#testing-harness)
9. [Prompt iteration playbook](#prompt-iteration-playbook)
10. [Critical risks and mitigations](#critical-risks-and-mitigations)
11. [Claude Code prompts in order](#claude-code-prompts-in-order)
12. [Launch checklist](#launch-checklist)

---

## Product definition

**One-liner:** Upload a screenshot of any UI, get clean React + Tailwind code you can paste into your project.

**Free tier:** 3 conversions per day, watermark-free output, basic templates.

**Paid tier ($9/mo):** Unlimited conversions (with 200/mo fair-use cap in ToS), framework choice (React/Vue/HTML), component library options, code history, priority processing.

**Pricing logic:** $9 signals quality and gives margin to upgrade Groq tier later. Higher friction than $5 but filters for serious users.

---

## Tech stack

| Layer            | Choice                                                 | Why                                           |
| ---------------- | ------------------------------------------------------ | --------------------------------------------- |
| Frontend         | Vite + React + TypeScript                              | Fast dev loop, small bundle                   |
| Styling          | Tailwind v4 + shadcn/ui                                | Industry standard for clean UI fast           |
| Backend          | FastAPI on Render                                      | You already know it from finance-kit/Magellan |
| AI               | Groq API — `meta-llama/llama-4-scout-17b-16e-instruct` | Free tier, vision-capable, fast               |
| Auth + DB        | Supabase                                               | Free Postgres + auth + storage                |
| Payments         | Lemon Squeezy                                          | Merchant of record, works in Thailand         |
| Rate limiting    | Upstash Redis                                          | Free tier, protects shared Groq budget        |
| Analytics        | Plausible or Vercel Analytics                          | Free tier                                     |
| Frontend hosting | Vercel or Cloudflare Pages                             | Free static hosting                           |

**Total monthly cost at zero users: $0.** Costs only scale with Lemon Squeezy taking ~5% on actual sales.

### Free tier limits to know

- **Groq Llama 4 Scout:** 30 requests/minute, 1,000 requests/day org-wide. This is your hard ceiling — at 3 conversions/day per user, you cap at ~333 active free users before throttling.
- **Render free tier:** Spins down after 15 minutes of inactivity. First request after idle takes 30–60s. Mitigation: UptimeRobot pings `/health` every 10 min, OR upgrade to $7/mo.
- **Supabase free:** 500MB database, 1GB storage, 50K monthly active users.
- **Upstash free:** 10K commands/day.

---

## Architecture flow

**Conversion flow:**

1. User uploads screenshot in Vite frontend
2. Frontend encodes to base64, POSTs to FastAPI `/convert` with Supabase JWT
3. Backend validates JWT → checks Upstash rate limit → checks daily quota in Postgres
4. Backend calls Groq Llama 4 Scout with system prompt + image
5. Backend cleans output (strip markdown fences, preambles)
6. Backend increments user's daily count, returns code
7. Frontend renders code with Prism.js syntax highlighting + copy button

**Payment flow:**

1. Free user hits 3/day limit → paywall modal opens
2. Modal links to Lemon Squeezy hosted checkout ($9/mo product)
3. User pays → Lemon Squeezy fires `subscription_created` webhook
4. Backend webhook handler upgrades user's `tier` to `paid` in Supabase
5. User's quota check now skips daily limit, allows up to 200/mo

---

## File structure

```
squint/
├── frontend/                       # Vite + React app
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── App.tsx             # The product page
│   │   │   ├── Pricing.tsx
│   │   │   └── Docs.tsx
│   │   ├── components/
│   │   │   ├── UploadZone.tsx
│   │   │   ├── CodeViewer.tsx
│   │   │   ├── FrameworkPicker.tsx
│   │   │   ├── PaywallModal.tsx
│   │   │   └── ui/                 # shadcn components
│   │   ├── lib/
│   │   │   ├── api.ts              # Calls FastAPI backend
│   │   │   └── supabase.ts
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                        # FastAPI app
│   ├── main.py                     # FastAPI app entry
│   ├── routes/
│   │   ├── convert.py              # POST /convert
│   │   ├── webhook.py              # POST /webhook/lemon
│   │   └── usage.py                # GET /usage
│   ├── services/
│   │   ├── groq_client.py          # Groq API wrapper
│   │   ├── prompts.py              # The system prompt
│   │   ├── cleaner.py              # Output cleaning
│   │   ├── supabase_client.py
│   │   └── ratelimit.py            # Upstash logic
│   ├── test_screenshots/           # Test images for prompt iteration
│   ├── test_outputs/               # Generated code from tests
│   ├── test_prompt.py              # Prompt testing harness
│   ├── requirements.txt
│   └── render.yaml                 # Render deployment config
│
└── README.md
```

---

## Day-by-day plan

### Day 1 — Saturday — Backend + conversion engine

**Morning (3 hours): Setup**

- Create accounts: Groq Console, Supabase, Upstash, Render, Vercel, Lemon Squeezy
- Get all keys into `.env` file
- Init git repo with `frontend/` and `backend/` folders
- Backend: `python -m venv venv` → activate → `pip install fastapi uvicorn groq supabase upstash-redis python-dotenv pillow`
- Frontend: `npm create vite@latest frontend -- --template react-ts` → `npm install`
- Install Tailwind v4, shadcn/ui, react-dropzone, prismjs, lucide-react, `@supabase/supabase-js`

**Afternoon (4 hours): The conversion endpoint**

- Build `backend/routes/convert.py`
- Accepts base64 image, validates size (<5MB), validates Supabase JWT, checks rate limit
- Calls Groq with Llama 4 Scout (see [system prompt](#the-system-prompt))
- Returns cleaned code

**Evening (2–3 hours): Test and iterate the prompt**

- Build [testing harness](#testing-harness)
- Drop 10 test screenshots in `test_screenshots/`
- Run, review outputs, iterate prompt
- Goal: 7+ out of 10 produce usable code before moving on

### Day 2 — Sunday — Frontend + auth + payments

**Morning (3 hours): Vite frontend skeleton**

- Drag-drop upload zone using react-dropzone
- Code viewer with Prism syntax highlighting + copy button
- Wire API calls to FastAPI via `VITE_API_URL` env var
- React Router for page structure

**Afternoon (3 hours): Supabase auth**

- Magic link auth (no passwords)
- Create `users` table:
  - `id` (uuid, PK)
  - `email` (text)
  - `tier` (enum: 'free' | 'paid')
  - `daily_conversions_used` (int)
  - `last_conversion_date` (date)
  - `lemon_subscription_id` (text, nullable)
- Frontend stores JWT, sends with every request
- Backend validates JWT on every request

**Evening (4 hours): Lemon Squeezy + landing page**

- Create $9/mo product in Lemon Squeezy dashboard
- Wire paywall modal → Lemon Squeezy hosted checkout
- Build webhook handler: `subscription_created` → upgrade tier; `subscription_cancelled` → downgrade
- Verify webhook signatures (this WILL break — use Lemon Squeezy test mode)
- Landing page: hero, demo placeholder, pricing, FAQ, footer

### Day 3 — Monday — Polish + launch prep

**Morning (3 hours): End-to-end test**

- Sign up with fresh email
- Convert 3 screenshots → hit limit → see paywall
- Pay (test mode) → verify upgrade
- Convert 5 more → sign out → sign in → verify state persists
- Common bugs to expect: webhook signature fails, HEIC iPhone uploads fail, mobile layout breaks

**Afternoon (2 hours): Marketing assets**

- 30-second demo video (QuickTime or Loom): upload → code appears → paste into Next.js project → it works
- 4–5 product screenshots with clean window chrome and good background

**Evening (3 hours): Draft launch posts**

- Show HN: "Show HN: Squint – Convert UI screenshots to React code"
- r/SideProject: casual "I built this in a weekend" framing
- IndieHackers: SaaS metrics + pricing decisions
- Twitter thread: 5–7 tweets, demo video as lead
- Product Hunt: schedule for Tuesday 12:01am PST

### Launch day — Tuesday

- 12:01am PST: Product Hunt goes live
- 8am PST: Show HN
- 9am PST: Reddit + IndieHackers
- 10am PST: Twitter thread
- Reply to every comment for first 12 hours

---

## The system prompt

Use this verbatim in `backend/services/prompts.py`. Iterate based on test results.

```python
SYSTEM_PROMPT = """You are an expert front-end engineer who converts UI screenshots into production-ready React code with Tailwind CSS. Your output is pasted directly into developers' projects, so it must be immediately usable.

## Your task

You will receive a screenshot of a user interface. You must output a single React functional component that visually replicates the screenshot as closely as possible.

## Internal process (do this silently, do NOT include in output)

Before writing any code, internally analyze:
1. The overall layout structure (header, sidebar, main content, footer)
2. The visual hierarchy (what is largest, boldest, most prominent)
3. The color palette (background, text, accents, borders)
4. Typography (heading sizes, body text, weight variations)
5. Spacing patterns (consistent padding, gaps between elements)
6. Interactive elements (buttons, inputs, links, toggles)
7. Reusable patterns (cards, list items, repeated components)

Do NOT output this analysis. Use it only to inform your code.

## Output rules — these are absolute

- Output ONLY the React component code. No markdown code fences. No backticks. No explanations before or after. No comments saying "Here is the component:".
- The component MUST be a default export named based on what the screenshot shows (e.g., `LoginPage`, `Dashboard`, `PricingTable`).
- Use TypeScript syntax (`function Foo(): JSX.Element` or `const Foo: React.FC = () => ...`).
- Use Tailwind CSS utility classes ONLY. No inline styles. No custom CSS files. No styled-components.
- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<button>` — not `<div>` for everything that has meaning.
- For icons, use lucide-react. Import only what you use: `import { Search, User } from "lucide-react"`.
- For images in the screenshot, use a placeholder: `<img src="https://placehold.co/600x400" alt="..." className="..." />`. Match the dimensions roughly.
- For text content shown in the screenshot, transcribe it exactly. Do not invent or change copy.
- All interactive elements must be functional HTML (`<button onClick={...}>`, `<input>`, etc.) even if onClick is empty `() => {}`.

## Styling rules

- Match the screenshot's color scheme exactly. Use Tailwind's color palette (e.g., `bg-slate-900`, `text-blue-500`). Pick the closest match.
- Match spacing closely. Use Tailwind's spacing scale (`p-4`, `gap-6`, `mt-8`).
- Match typography weight and size (`text-xl font-bold`, `text-sm text-gray-500`).
- Make the layout responsive by default. Use `flex`, `grid`, and responsive prefixes (`md:`, `lg:`) where the screenshot suggests a desktop layout.
- For rounded corners, shadows, and borders, match what you see (`rounded-lg`, `shadow-md`, `border border-gray-200`).

## Ambiguity rules — when in doubt, default to these

- Hover states unclear? Use `hover:opacity-90` for buttons, `hover:bg-gray-50` for list items.
- Focus states unclear? Use `focus:outline-none focus:ring-2 focus:ring-blue-500`.
- Animation unclear? Use `transition-colors duration-200` on interactive elements.
- Font family unclear? Don't specify one. Inherit from the parent.
- Empty list states or repeated rows? Show 3 example items.

## Component structure

The component should be self-contained and immediately renderable. Imports go at the top. Helper functions (if any) go inside the component. Return a single root JSX element.

Example structure (do NOT copy the content, only the shape):

import { Search } from "lucide-react";

export default function ComponentName() {
  return (
    <main className="...">
      ...
    </main>
  );
}

Now analyze the screenshot and output the component."""
```

### Why this prompt is structured this way

- **Internal process section** forces planning without leaking to output (chain-of-thought, hidden).
- **Strong "absolute" wording** on output rules reduces (but doesn't eliminate) markdown fences and preambles. Llama 4 Scout especially loves to wrap output in ` ` — defensive cleaning still required.
- **Concrete component vocabulary** (lucide-react, Tailwind classes) prevents hallucinated imports.
- **Ambiguity rules** force consistency across requests. Without them, two similar screenshots produce wildly different code.
- **Semantic HTML demand** is what separates "AI slop" from "code I'd paste into my project."

### Calling the model

```python
from groq import Groq
import os

client = Groq(api_key=os.environ["GROQ_API_KEY"])

response = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": SYSTEM_PROMPT},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
        ]
    }],
    temperature=0.2,   # lower = more deterministic code
    max_tokens=4000
)

raw_output = response.choices[0].message.content
cleaned = clean_llm_output(raw_output)
```

---

## Defensive output cleaning

Even with the prompt, Llama 4 Scout sometimes ignores instructions. Build this in `backend/services/cleaner.py`:

````python
import re

def clean_llm_output(raw: str) -> str:
    """Strip markdown fences, explanatory preambles, and trailing commentary."""
    # Remove markdown code fences: ```tsx ... ``` or ``` ... ```
    fence_pattern = r"^```(?:tsx|typescript|jsx|javascript|js|ts)?\s*\n(.*?)\n```\s*$"
    match = re.search(fence_pattern, raw, re.DOTALL | re.MULTILINE)
    if match:
        raw = match.group(1)

    # Remove common preambles
    preambles = [
        "Here is the component:",
        "Here's the component:",
        "Here is the React component:",
        "Sure! Here is",
        "Here is the code:",
    ]
    for p in preambles:
        if raw.lstrip().startswith(p):
            raw = raw.lstrip()[len(p):].lstrip()

    # Find first import/export/const/function line — discard anything before it
    lines = raw.split("\n")
    for i, line in enumerate(lines):
        stripped = line.strip()
        if (stripped.startswith("import ")
            or stripped.startswith("export ")
            or stripped.startswith("const ")
            or stripped.startswith("function ")):
            return "\n".join(lines[i:]).strip()

    return raw.strip()
````

Call this on every Groq response before returning to the frontend.

---

## Testing harness

Build this on Day 1 evening — saves hours of manual testing later. Create `backend/test_prompt.py`:

```python
import os
from pathlib import Path
from groq import Groq
import base64
from services.prompts import SYSTEM_PROMPT
from services.cleaner import clean_llm_output

client = Groq(api_key=os.environ["GROQ_API_KEY"])
TEST_DIR = Path("test_screenshots")
OUTPUT_DIR = Path("test_outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

for img_path in TEST_DIR.glob("*.png"):
    print(f"Testing {img_path.name}...")
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": SYSTEM_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
            ]
        }],
        temperature=0.2,
        max_tokens=4000
    )

    cleaned = clean_llm_output(response.choices[0].message.content)
    out_path = OUTPUT_DIR / f"{img_path.stem}.tsx"
    out_path.write_text(cleaned)
    print(f"  → {out_path}")
```

### Suggested test screenshots

**Easy wins (must work):**

- Simple login form
- Single pricing card
- Hero section with headline + CTA

**Medium difficulty:**

- Navigation bar with logo + links + button
- 3-column feature grid
- Testimonial card with avatar + quote

**Hard cases (expose weaknesses):**

- Complex dashboard with sidebar + chart + table
- Twitter/X post (lots of nested elements)
- Stripe-style landing page section
- Email inbox UI

**Quality bar:**

- 7–8/10 produce usable code → ship
- 5–6/10 → ship beta with disclaimer
- 3–4/10 → keep iterating prompt

---

## Prompt iteration playbook

When test outputs fail, diagnose with these patterns:

| Failure                                       | Fix                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Invents text not in screenshot                | Add: "If text is unreadable, use 'Lorem ipsum' rather than inventing."                                          |
| Generic colors instead of matching            | Add 2–3 explicit examples: "Twitter blue → `bg-sky-500`. Stripe purple → `bg-violet-600`."                      |
| Layout structurally wrong (sidebar → top bar) | Lower `temperature` to 0.1. This is a vision limit, not prompt.                                                 |
| Code doesn't compile                          | Add: "Verify every JSX tag closed, every import used, every var defined. Omit questionable lines."              |
| Output truncated                              | Increase `max_tokens` to 8000. Add: "If many repeated elements, show only 3–4 representative items."            |
| Markdown fences leak through                  | Strengthen cleaner regex. Add to prompt: "If you include ``` characters anywhere, the output will be rejected." |
| Hallucinated component imports                | Add: "Only import from these libraries: react, lucide-react. No other imports allowed."                         |

---

## Critical risks and mitigations

### Risk 1: Groq rate limits cap traffic at ~333 free users

**Mitigation:** Add credit card to Groq Developer tier ($0 minimum, 10x limits, 25% cheaper) BEFORE launch day. The reason behind this matters is that going viral on HN with a rate-limited product = dead launch.

### Risk 2: Render free tier 30–60s cold starts kill UX

**Mitigation:** Either (a) UptimeRobot pings `/health` every 10 min (free), or (b) upgrade to $7/mo Render Basic. Slow first conversion = no word-of-mouth.

### Risk 3: EU users illegal under Llama 4 license

**Mitigation:** ToS states service unavailable in EU. Add IP-based blocker on backend if you want to be careful.

### Risk 4: Output quality not premium-feeling at $9/mo

**Mitigation:** Heavy prompt iteration on Day 1. Have a clear "best for landing pages and simple components" disclaimer. Show example outputs on landing page so users self-select.

### Risk 5: Webhook signature verification breaks

**Mitigation:** Use Lemon Squeezy test mode end-to-end on Day 2. Use ngrok for local webhook debugging. Expected to break, plan time for it.

### Risk 6: Heavy paid users blow Groq quota

**Mitigation:** "Fair use" 200 conversions/month cap on paid tier, in ToS. Most users won't hit it. Track per-user counts in Postgres.

---

## Claude Code prompts in order

Hand these to Claude Code one session at a time:

1. _"Set up a Vite + React + TypeScript project with Tailwind v4, shadcn/ui, and React Router. Create the page structure: Landing, App, Pricing, Docs."_

2. _"Set up a FastAPI backend with CORS, Supabase JWT validation middleware, and a /health endpoint. Use python-dotenv for env vars."_

3. _"Build the screenshot upload component using react-dropzone. Validate size <5MB, accept PNG/JPG/WEBP, encode to base64."_

4. _"Build the FastAPI /convert endpoint that takes a base64 image, validates auth, checks rate limit via Upstash, calls Groq Llama 4 Scout with this system prompt [paste], cleans output with this function [paste], and returns the generated code."_

5. _"Build the code viewer component with Prism.js syntax highlighting, framework tabs, and copy-to-clipboard."_

6. _"Wire up Supabase magic link auth in the Vite frontend and create the users table schema with these columns [paste]."_

7. _"Build the Lemon Squeezy checkout flow and FastAPI webhook handler. Verify webhook signatures with HMAC."_

8. _"Build the landing page with hero, demo, features, pricing, FAQ. Use shadcn/ui components. Lean into the 'squint' metaphor — copy like 'Stop squinting at designs and rebuilding them by hand.'"_

---

## Launch checklist

### Pre-launch (by Monday night)

- [ ] Domain purchased: `squint.dev` / `getsquint.com` / `trysquint.dev`
- [ ] All 6 accounts created (Groq, Supabase, Upstash, Render, Vercel, Lemon Squeezy)
- [ ] Groq Developer tier upgraded (credit card added)
- [ ] End-to-end test passed (signup → convert → pay → upgrade)
- [ ] Demo video recorded (30s max)
- [ ] 5 product screenshots taken
- [ ] Show HN post drafted
- [ ] r/SideProject post drafted
- [ ] IndieHackers post drafted
- [ ] Twitter thread drafted (5–7 tweets)
- [ ] Product Hunt scheduled for Tuesday 12:01am PST
- [ ] UptimeRobot pinging `/health` every 10 min
- [ ] ToS includes EU exclusion + 200/mo fair-use cap

### Launch day (Tuesday)

- [ ] 12:01am PST: PH live, share to friends/family
- [ ] 8am PST: Show HN posted
- [ ] 9am PST: Reddit + IndieHackers posted
- [ ] 10am PST: Twitter thread posted
- [ ] Monitor Groq rate limit headers — upgrade further if hitting caps
- [ ] Reply to every single comment for first 12 hours
- [ ] Track signups, conversions, paid conversions in spreadsheet

### Week 1 post-launch

- [ ] Daily Twitter post showing a cool conversion
- [ ] Reach out to 10 dev YouTubers with review codes
- [ ] Replace placeholder testimonials with real user quotes
- [ ] Fix top 3 user complaints
- [ ] Write a blog post about the build (more SEO surface)

---

## Quick reference

**Groq vision model:** `meta-llama/llama-4-scout-17b-16e-instruct`
**Free tier:** 30 RPM, 1,000 RPD, 6,000 TPM
**Image format:** base64, sent as `data:image/png;base64,{...}` in `image_url.url`
**Max image size:** 5MB recommended (Groq accepts more but slow)
**Recommended params:** `temperature=0.2`, `max_tokens=4000`

**Lemon Squeezy webhook events:**

- `subscription_created` → upgrade user to paid
- `subscription_cancelled` → downgrade user
- `subscription_payment_failed` → flag account
- `subscription_resumed` → re-upgrade

**Supabase users table:**

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
```

---

_Last updated: 2026-04-26. Iterate this doc as you build — it's your living plan, not a contract._
