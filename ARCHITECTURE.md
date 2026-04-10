# Nenyax Architecture — Module System & Claude Builder

## The Vision

The module is the core brain of Nenyax. It sits between STT and TTS and today it's just one agent that replies. The vision is to make this module a full orchestration layer where a builder on Nenyax opens the Claude chat panel and says something like "build me a receptionist that checks my calendar and routes to sales or support." The system then constructs what's needed inside the module. The module's interface stays the same (text in, text out) but what's inside can be anything.

From the builder's perspective, they don't think in terms of agents, MCPs, or architecture patterns. They describe what they want in plain English and the module gets built. The module is a blank canvas — whatever the builder can describe, the system should be able to construct. The possibilities are limitless.

From the end user's perspective — the person actually calling into a system built on Nenyax — the experience should be seamless. They can naturally move between agents, hear tools being used, and the whole system feels like one intelligent entity even if behind the scenes it's multiple agents and tools working together.

## Two Separate Systems

### Builder (Claude Agent SDK) — Development Time
- Developer on web app, async, not real-time
- Claude Opus/Sonnet level, takes 5-30 seconds per action
- Full filesystem access, reads/edits code
- Produces module configs, custom functions, or direct code changes
- Uses Claude Agent SDK (Python) running in FastAPI backend

### Runtime (Voice Pipeline) — Call Time
- Caller on phone, real-time, responses under 500ms
- Fast LLM (Gemini Flash / Haiku), lightweight
- Reads module config, handles conversation, routes between agents, calls MCPs
- No filesystem access, no code editing

### Why They Must Be Separate
1. **Latency** — voice calls need <500ms responses. Builder operations take 5-30 seconds.
2. **Security** — builder has write access to the codebase. Voice LLM should never have that.
3. **Cost** — builder needs a powerful model (Opus/Sonnet). Voice needs a fast, cheap model.

### Analogy
The builder is a car factory — heavy machinery, takes time, builds the car. The runtime is the car — lightweight, drives in real-time. You don't bring the factory along on every drive.

## Hybrid Approach (3 Layers)

### Layer 1: Module Config (Database)
- Agent definitions, prompts, MCP connections, routing rules, voice settings
- JSON stored in PostgreSQL
- Covers 90% of use cases
- Multi-tenant safe, versionable, rollbackable

**Example triggers:**
- "Make my agent friendlier" → update system prompt in config
- "Connect Google Calendar" → add MCP connection to config
- "Route to sales if caller mentions pricing" → add routing rule to config

### Layer 2: Sandboxed Custom Code (Per User)
- Small Python functions for logic that config can't express
- Stored as files in `custom_functions/` directory
- Runs in Docker sandbox container (no network, no filesystem, CPU/memory limited)
- Like a plugin — snaps in, snaps out

**Example triggers:**
- "Validate order numbers start with ORD-" → generate validation function
- "Calculate custom quote based on plan tier" → generate calculation function

**Sandbox container spec:**
```yaml
sandbox-runner:
  network_mode: none        # no internet
  mem_limit: 128m           # 128MB max
  cpus: 0.5                 # half a CPU core
  read_only: true           # can't write to filesystem
```

### Layer 3: Direct Code Modification (Self-Hosted Only)
- Claude Agent SDK edits actual frontend/backend/agent source files
- Add new API endpoints, dashboard pages, pipeline features
- Full power, highest risk
- Disabled on Nenyax Cloud (multi-tenant safety)

**Example triggers:**
- "Add a new analytics page showing transfer success rates" → edit frontend/backend code
- "Add a custom webhook endpoint for my CRM" → edit backend code

### How Claude Decides Which Layer
Claude analyzes the user's request and picks the simplest layer that achieves it. Simple config change? Layer 1. Needs custom logic? Layer 2. Needs structural changes? Layer 3. The user never thinks about layers — they just describe what they want.

## Architecture Diagram

```
+-----------------------------------------------------------+
|                   FRONTEND (Next.js)                       |
|                                                            |
|  +-------------------+    +-----------------------------+  |
|  |    Dashboard       |    |  Claude Chat Panel           |  |
|  |    (existing)      |    |  (collapsible, right side)   |  |
|  |                    |    |                               |  |
|  |                    |    |  WebSocket connection --------+--+--+
|  +-------------------+    +-----------------------------+  |  |
+-----------------------------------------------------------+  |
                                                                |
+-----------------------------------------------------------+  |
|                   BACKEND (FastAPI)                         |  |
|                                                            |  |
|  +------------------------------------------------------+  |  |
|  |  Builder Service (NEW)                          <-----+--+
|  |                                                       |  |
|  |  CLAUDE AGENT SDK (Python)                            |  |
|  |  - WebSocket endpoint (/ws/builder)                   |  |
|  |  - Receives user messages from chat panel             |  |
|  |  - Runs Claude with full tool access                  |  |
|  |  - Streams responses back                             |  |
|  |                                                       |  |
|  |  Claude decides:                                      |  |
|  |    Layer 1 -> Update module config in DB              |  |
|  |    Layer 2 -> Generate custom function files          |  |
|  |    Layer 3 -> Edit source code directly               |  |
|  +------------------------------------------------------+  |
|                                                            |
|  +------------------------------------------------------+  |
|  |  Module Configs (PostgreSQL)                          |  |
|  |                                                       |  |
|  |  {                                                    |  |
|  |    "version": "1.0",                                  |  |
|  |    "entry_agent": "receptionist",                     |  |
|  |    "agents": {                                        |  |
|  |      "receptionist": {                                |  |
|  |        "prompt": "You are a friendly receptionist...",|  |
|  |        "llm": "gemini",                               |  |
|  |        "voice": "resemble-sarah",                     |  |
|  |        "mcps": ["google-calendar"],                   |  |
|  |        "routes_to": ["sales", "support"],             |  |
|  |        "routing_rules": "If about pricing -> sales."  |  |
|  |      },                                               |  |
|  |      "sales": { ... },                                |  |
|  |      "support": { ... }                               |  |
|  |    },                                                 |  |
|  |    "mcps": {                                          |  |
|  |      "google-calendar": { "server": "...", ... }      |  |
|  |    },                                                 |  |
|  |    "global": {                                        |  |
|  |      "max_transfer_depth": 3,                         |  |
|  |      "fallback": "receptionist",                      |  |
|  |      "timeout_seconds": 300                           |  |
|  |    }                                                  |  |
|  |  }                                                    |  |
|  +------------------------------------------------------+  |
|                                                            |
|  +------------------------------------------------------+  |
|  |  Existing API (agents, sessions, costs — unchanged)   |  |
|  +------------------------------------------------------+  |
+-----------------------------------------------------------+
                       |
                       | loads config at call start
                       v
+-----------------------------------------------------------+
|              AGENT SERVICE (LiveKit)                        |
|                                                            |
|  Runtime Engine (ENHANCED)                                 |
|                                                            |
|  Currently:  STT -> Gemini -> TTS                          |
|                                                            |
|  New:        STT -> Module Engine -> TTS                   |
|                       |                                    |
|                       +-- Load module config               |
|                       +-- Spin up agent(s)                 |
|                       +-- Connect MCPs                     |
|                       +-- Handle routing between agents    |
|                       +-- Execute custom functions          |
|                       +-- Pass context between agents      |
|                       +-- Manage escalation rules          |
+-----------------------------------------------------------+

+-----------------------------------------------------------+
|              SANDBOX RUNNER (Docker container)              |
|                                                            |
|  - Executes Layer 2 custom functions                       |
|  - No network, no filesystem access                        |
|  - CPU/memory limited, timeout enforced                    |
|  - Called by agent service via HTTP when needed             |
+-----------------------------------------------------------+
```

## Why Python SDK for Claude Agent

1. **Builder service lives in FastAPI backend** — same Python environment
2. **Filesystem access** — backend server is where the codebase lives, SDK can read/edit all three services
3. **Database access** — module configs go straight to PostgreSQL via SQLAlchemy
4. **Auth** — backend already knows who the user is
5. **Agent service is Python** — SDK understands the code it's editing
6. **WebSocket support** — already available in FastAPI

## Module Config Schema (Contract Between Builder and Runtime)

```json
{
  "version": "1.0",
  "entry_agent": "receptionist",
  "agents": {
    "receptionist": {
      "prompt": "You are a friendly receptionist for Acme Corp...",
      "llm": "gemini",
      "voice": "resemble-sarah",
      "mcps": ["google-calendar"],
      "routes_to": ["sales", "support"],
      "routing_rules": "If about pricing -> sales. If issue -> support."
    },
    "sales": {
      "prompt": "You are a sales specialist...",
      "llm": "gemini",
      "voice": "resemble-james",
      "mcps": ["hubspot"],
      "routes_to": [],
      "escalate_to_human": true
    },
    "support": {
      "prompt": "You are a support agent...",
      "llm": "gemini",
      "voice": "resemble-sarah",
      "mcps": ["jira"],
      "routes_to": [],
      "escalate_to_human": true
    }
  },
  "mcps": {
    "google-calendar": { "server": "...", "auth": "..." },
    "hubspot": { "server": "...", "auth": "..." },
    "jira": { "server": "...", "auth": "..." }
  },
  "custom_functions": ["validate_order", "calculate_quote"],
  "global": {
    "max_transfer_depth": 3,
    "fallback": "receptionist",
    "timeout_seconds": 300
  }
}
```

## Build Order

| Step | What | Depends On | Notes |
|------|------|------------|-------|
| 1 | Module config schema | Nothing | Define the JSON structure — contract between builder and runtime |
| 2 | Runtime engine | Step 1 | Make agent service load and run configs. Replace simple Gemini call with config-driven pipeline |
| 3 | Builder service | Step 1 | Claude Agent SDK in FastAPI with WebSocket endpoint |
| 4 | Chat panel UI | Step 3 | Collapsible panel on right side of frontend, connects via WebSocket |
| 5 | Layer 2 sandboxing | Step 2 | Docker sandbox container for custom code execution |
| 6 | Layer 3 code mod | Step 3 | Direct codebase editing for self-hosted users |

Steps 1-2 don't need Claude at all. You can hand-write a module config and test the runtime engine. Then Claude becomes a smarter way to produce those configs.

## Key Design Decisions

1. **Module config is the contract** — builder produces it, runtime consumes it. Clean separation.
2. **Layers are internal** — the user never thinks about which layer is being used.
3. **Builder and runtime use different LLMs** — builder needs intelligence (Claude), runtime needs speed (Gemini/Haiku).
4. **Config-first approach** — most things should be achievable with config. Custom code and code modification are escape hatches.
5. **Self-hosted vs Cloud** — Layer 3 (code mod) is only for self-hosted. Cloud users get Layer 1 + 2.
6. **One thing at a time** — nail module config + runtime engine first, then add Claude builder on top.
