<div align="center">

# Arkenos

### Composable orchestration layer for enterprise-grade conversational AI infrastructure.

Build, deploy, and manage production voice agents with runtime compute, persistent memory, MCP tool integration, and full infrastructure control — all from a single platform.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub Stars](https://img.shields.io/github/stars/arkenos-ai/arkenos?style=social)](https://github.com/arkenos-ai/arkenos)

[Website](https://arkenos.ai) · [Documentation](https://docs.arkenos.ai) · [Discord](https://discord.gg/arkenos) · [Twitter](https://twitter.com/arkenosai)

</div>

---

## The Problem

Building production-grade voice AI is painful. You stitch together STT, LLM, and TTS providers, write glue code for telephony, build dashboards for monitoring, and end up with a fragile pipeline that breaks every time you swap a vendor. Your agents are stateless, your tools are hardcoded, and customizing anything requires a full engineering cycle.

## What is Arkenos?

Arkenos is an open-source orchestration layer that gives every voice agent a **personal runtime computer**. Instead of building dumb pipelines, you deploy intelligent agents that can:

- **Process and reason** across live conversations with function calling and tool execution
- **Manage persistent memory** to maintain context across sessions and interactions
- **Perform real-time tasks** — database lookups, API calls, booking, scheduling — mid-conversation
- **Connect to MCP servers** for universal tool access without custom integrations
- **Self-customize** through on-platform coding agents that modify agent behavior via natural language

You define what your agent should do. Arkenos handles the infrastructure.

---

## Key Capabilities

### Composable Voice Pipeline
Swap any component without rewriting your stack. Plug in your preferred STT, LLM, and TTS providers and Arkenos orchestrates the full real-time audio pipeline with sub-second latency.

| Layer | Supported Providers |
|-------|-------------------|
| Speech-to-Text | AssemblyAI, Deepgram, ElevenLabs |
| LLM | Google Gemini (with function calling) |
| Text-to-Speech | Resemble AI |
| Real-time Transport | LiveKit |
| Telephony | Twilio (inbound + outbound + transfer) |

### Runtime Agent Computer
Every agent gets an isolated execution environment at runtime. Agents can call functions, hit HTTP endpoints, trigger webhooks, and execute multi-step workflows — all while maintaining a live voice conversation.

### On-Platform Customization
Configure every aspect of your agent through the dashboard or let on-platform coding agents handle it. System prompts, voice selection, STT provider, function definitions, webhook chains — all configurable without touching infrastructure code.

### Enterprise Telephony
Full telephony stack out of the box. Inbound routing via SIP trunks, outbound dialing, warm and cold call transfers, phone number provisioning and management — all through the API or dashboard.

### Call Intelligence
Every conversation is automatically analyzed post-call:
- AI-generated summaries and action items
- Sentiment analysis with confidence scoring
- Topic extraction and outcome classification
- Full transcript with speaker labels and timestamps

### Cost Observability
Track spend across every provider, every agent, every call. Per-session cost breakdowns across STT minutes, LLM tokens, and TTS characters with timeline charts and agent-level aggregation.

---

## Architecture

```
arkenos/
├── frontend/          Next.js 16 · React 19 · Tailwind · Better Auth
├── backend/           FastAPI · SQLAlchemy · PostgreSQL
├── agent/             Python · LiveKit Agents SDK
└── docker-compose.yml
```

```
Caller ──→ Twilio SIP ──→ LiveKit Room ──→ Arkenos Agent
                                               │
                          ┌────────────────────┤
                          ▼                    ▼
                    STT Provider          TTS Provider
                    (AssemblyAI)          (Resemble AI)
                          │                    ▲
                          ▼                    │
                     LLM Engine ──→ Tool Execution ──→ MCP / Webhooks / APIs
                   (Gemini 2.5 Flash)    │
                                       ▼
                                  Memory & State
```

---

## Quick Start

```bash
git clone https://github.com/dhruv0206/Arkenos.git
cd Arkenos

# Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit each .env with your values

# Launch
docker-compose up -d --build
```

Open [http://localhost:4200](http://localhost:4200) to access the dashboard.

For local development setup, see the [Development Guide](https://docs.arkenos.ai/local-development).

> **Note:** The agent service requires no `.env` file — it fetches all API keys from the backend dashboard on startup.

---

## Documentation

Full documentation is available at **[docs.arkenos.ai](https://docs.arkenos.ai)** — quickstart, local development, configuration guides, architecture deep-dives, and interactive API reference.

The backend exposes 32+ REST endpoints across 8 routers covering agents, sessions, telephony, costs, usage tracking, voice management, and real-time communication. See the [API Reference](https://docs.arkenos.ai/api-reference) for the full interactive playground.

---

## Roadmap

- [ ] Multi-LLM orchestration (Claude, GPT, Llama, etc.)
- [ ] Multi-TTS provider support (ElevenLabs, PlayHT, Cartesia)
- [ ] Persistent agent memory across sessions
- [ ] MCP server integration for universal tool access
- [ ] Visual graph builder for multi-agent flows
- [ ] On-platform coding agents for agent customization
- [ ] Embeddable voice widget for web apps
- [ ] Audio recording storage and playback
- [ ] Arkenos Cloud (managed platform)

---

## Contributing

We welcome contributions from the community. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, and read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

<div align="center">

#### Voice infrastructure powered by [Resemble AI](https://www.resemble.ai)

</div>

---

## License

Arkenos is open-source software licensed under the [GNU Affero General Public License v3.0](LICENSE).

This means you can freely use, modify, and distribute Arkenos, but any modifications to the codebase must also be made available under the same license — including when running a modified version as a network service.

For commercial licensing inquiries, contact [hello@arkenos.ai](mailto:hello@arkenos.ai).
