---
title: Squint Backend
emoji: 🔭
colorFrom: purple
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# Squint Backend

FastAPI + CrewAI 4-agent pipeline that converts UI screenshots to code.

## Environment variables (set in Space secrets)

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter key for text agents |
| `GROQ_API_KEY` | No | Groq key for vision (falls back to OpenRouter) |
| `PAYMENT_SECRET` | Yes | Random hex string for signing payment tokens |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins (default: localhost) |
