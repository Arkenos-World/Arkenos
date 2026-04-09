# Nenyax — Agent Context

## Project Overview
Composable orchestration layer for enterprise-grade conversational AI infrastructure. Open-source, three services.

## Services
| Service  | Stack                                              | Local URL             |
|----------|----------------------------------------------------|-----------------------|
| frontend | Next.js 16, React 19, Tailwind, Better Auth        | http://localhost:3000 |
| backend  | FastAPI, SQLAlchemy, PostgreSQL                    | http://localhost:8000 |
| agent    | Python, LiveKit, AssemblyAI, Gemini, Resemble AI   | N/A                   |

## Database
Main: postgresql://postgres:nenyax@localhost:5434/nenyax
Test: postgresql://postgres:nenyax@localhost:5434/nenyax_test
(Envless — defaults in config.py and auth.ts. No .env needed for local dev.)

## How to Run Each Service
frontend → cd frontend && npm run dev
backend  → cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
agent    → cd agent && venv\Scripts\activate && python agent.py dev

## Rules Every Agent Must Follow
- NEVER hardcode secrets — always use .env files
- NEVER commit .env files
- Always read .claude/api-contracts.md before touching any API
- If you change an endpoint shape → update api-contracts.md first
- All /api/dashboard/* routes require Better Auth middleware
- Run your verification script before reporting done
- Write to .claude/run-state.json at every step

## Key Integrations
- Auth: Better Auth (frontend SDK + backend x-user-id header)
- Real-time: LiveKit (do not break room/token flow)
- STT: AssemblyAI / Deepgram
- LLM: Google Gemini
- TTS: Resemble AI
- Telephony: Twilio