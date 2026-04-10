# LiveKit Multi-Org Deployment Options

## Current State

- Agent connects to **one** LiveKit project at boot
- All orgs must share the same `livekit_url`
- Per-call key re-injection works for STT/LLM/TTS/Telephony (different keys per org)
- LiveKit keys are fetched from the first org that has them configured

## Option A: Shared LiveKit Project (Launch)

All cloud orgs share a single platform-managed LiveKit project.

- **No agent changes needed** — works today
- Platform team manages the LiveKit infrastructure
- Orgs configure only: STT, LLM, TTS, Telephony keys
- LiveKit keys set at platform level, not per-org
- SIP trunks/dispatch rules shared across orgs (already works)

**Pros:** Zero code changes, simple ops, single billing
**Cons:** No isolation between orgs at LiveKit level, can't support customer-owned LiveKit

## Option B: Bring-Your-Own LiveKit (Enterprise)

Enterprise customers use their own LiveKit project.

### Required Changes

**Backend:**
- New endpoint: `GET /settings/keys/agent/livekit-projects` — returns all unique LiveKit project URLs across orgs
- Agent bootstrap calls this instead of `/settings/keys/agent`

**Agent:**
- At boot, query backend for all unique LiveKit projects
- Spawn one worker process per unique `livekit_url`
- Each worker registers as `nenyax-agent` on its project independently
- Per-call: resolve org from agent config → inject that org's keys

**Frontend:**
- No changes needed (orgs already configure livekit_url in API keys)

### Architecture

```
Backend returns:
  [
    { "livekit_url": "wss://platform.livekit.cloud", "org_ids": ["org1", "org2"] },
    { "livekit_url": "wss://enterprise.livekit.cloud", "org_ids": ["org3"] },
  ]

Agent spawns:
  Worker 1 → wss://platform.livekit.cloud  (handles org1, org2 calls)
  Worker 2 → wss://enterprise.livekit.cloud (handles org3 calls)
```

**Pros:** Full isolation, enterprise customers keep their own LiveKit
**Cons:** More complex agent, need to handle worker lifecycle (add/remove as orgs change keys)

## Decision

- **Launch:** Option A
- **Enterprise tier:** Option B (implement when first enterprise customer needs it)
