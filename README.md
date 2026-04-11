<div align="center">

# Nenyax

### Composable orchestration layer for enterprise-grade conversational AI infrastructure.

Build, deploy, and manage production voice agents with runtime compute, persistent memory, MCP tool integration, and full infrastructure control — all from a single platform.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub Stars](https://img.shields.io/github/stars/Nenyax-AI/Nenyax?style=social)](https://github.com/Nenyax-AI/Nenyax)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/nenyax)

[Website](https://nenyax.ai) · [Documentation](https://nenyax.mintlify.app) · [Discord](https://discord.gg/nenyax) · [Twitter](https://twitter.com/nenyaxai)

</div>

---

## The Problem

Building production-grade voice AI is painful. You stitch together STT, LLM, and TTS providers, write glue code for telephony, build dashboards for monitoring, and end up with a fragile pipeline that breaks every time you swap a vendor. Your agents are stateless, your tools are hardcoded, and customizing anything requires a full engineering cycle.

## What is Nenyax?

Nenyax is an open-source orchestration layer that gives every voice agent a **personal runtime computer**. Instead of building dumb pipelines, you deploy intelligent agents that can:

- **Process and reason** across live conversations with function calling and tool execution
- **Manage persistent memory** to maintain context across sessions and interactions
- **Perform real-time tasks** — database lookups, API calls, booking, scheduling — mid-conversation
- **Connect to MCP servers** for universal tool access without custom integrations
- **Self-customize** through on-platform coding agents that modify agent behavior via natural language

You define what your agent should do. Nenyax handles the infrastructure.

---

## Key Capabilities

### Composable Voice Pipeline
Swap any component without rewriting your stack. Plug in your preferred STT, LLM, and TTS providers and Nenyax orchestrates the full real-time audio pipeline with sub-second latency.

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
nenyax/
├── frontend/          Next.js 16 · React 19 · Tailwind · Better Auth
├── backend/           FastAPI · SQLAlchemy · PostgreSQL
├── agent/             Python · LiveKit Agents SDK
└── docker-compose.yml
```

```
Caller ──→ Twilio SIP ──→ LiveKit Room ──→ Nenyax Agent
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

### Local Development

```bash
git clone https://github.com/Nenyax-AI/Nenyax.git
cd Nenyax

# Only one env var needed
echo "POSTGRES_PASSWORD=nenyax" > .env

# Launch all services
docker compose up -d --build
```

Open [http://localhost:4200](http://localhost:4200) → create account → add API keys in Settings.

To use custom agents locally, also build the base image:

```bash
docker build -t nenyax-agent-base:latest -f agent/Dockerfile.base agent/
```

For running services outside Docker, see the [Development Guide](https://nenyax.mintlify.app/local-development).

---

## Deploy

### Self-Hosted (Recommended — Full Features)

Deploy Nenyax on any Linux VPS with a single command. This is the recommended deployment method — it supports **all features** including custom agents with Docker sandboxes.

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Nenyax-AI/Nenyax/master/install.sh)"
```

The install script automatically:
- Installs Docker if not present
- Generates secure random credentials (Postgres, MinIO, auth)
- Sets up HTTPS (auto Let's Encrypt with a domain, or self-signed for IP-only access)
- Builds all services and the custom agent base image
- Prints your URL and credentials when done

**Requirements:**
- Any Linux VPS with 4GB+ RAM (Ubuntu 22.04+ recommended)
- Works on any cloud: DigitalOcean, Google Cloud, Hetzner, AWS, Vultr, Linode, etc.

**Recommended VPS providers:**

| Provider | Plan | Price |
|----------|------|-------|
| Hetzner CX22 | 4GB / 2vCPU | ~€7/mo |
| DigitalOcean | 4GB / 2vCPU | ~$24/mo |
| Vultr | 4GB / 2vCPU | ~$18/mo |
| Google Cloud e2-medium | 4GB / 2vCPU | ~$25/mo |

<details>
<summary><b>Google Cloud step-by-step example</b></summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com) → Compute Engine → VM Instances → Create Instance
2. Configure:
   - Machine type: `e2-medium` (2 vCPU, 4GB RAM)
   - Boot disk: **Ubuntu 24.04 LTS**, **x86**, **30GB SSD**
   - Firewall: check **Allow HTTP** and **Allow HTTPS**
3. Click **Create**, then click **SSH** to connect
4. Run the install command above
5. When prompted for domain, enter your domain or press Enter to use the IP
6. Open `https://<your-ip>` in your browser (click through the self-signed cert warning if no domain)
7. Create your account → Settings → API Keys → add your provider keys

</details>

### Railway (One-Click — Standard Agents Only)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/nenyax)

The Railway template provides a **zero-configuration** deployment. It automatically provisions PostgreSQL, deploys all services, and wires internal routing.

1. Click the button above and click **Deploy**
2. Wait for all 4 services to show as "Online"
3. Open your deployed Frontend URL
4. Sign up → Settings → API Keys → add your provider keys

> **Note:** Custom agents (code editor + Docker containers) are **not supported** on Railway or Render. These platforms don't provide Docker socket access. Use the self-hosted deployment above for full features.

### Render

Render deployment is also supported via the included [`render.yaml`](render.yaml) blueprint. Same limitation as Railway — standard agents only, no custom agents. See [Render docs](https://docs.render.com/infrastructure-as-code) for details.

### Feature Comparison

| Feature | Self-Hosted (VPS) | Railway / Render |
|---------|-------------------|------------------|
| Standard agents | ✅ | ✅ |
| Custom agents (code editor) · *preview* | ✅ | ❌ |
| Docker sandbox containers · *preview* | ✅ | ❌ |
| AI coding assistant · *preview* | ✅ | ❌ |
| Dashboard & API | ✅ | ✅ |
| Telephony (Twilio) | ✅ | ✅ |
| Call intelligence | ✅ | ✅ |
| Cost tracking | ✅ | ✅ |
| Auto HTTPS | ✅ | ✅ |
| Full data ownership | ✅ | Partial |

---

## Documentation

Full documentation is available at **[nenyax.mintlify.app](https://nenyax.mintlify.app)** — quickstart, local development, configuration guides, architecture deep-dives, and interactive API reference.

The backend exposes 32+ REST endpoints across 8 routers covering agents, sessions, telephony, costs, usage tracking, voice management, and real-time communication. See the [API Reference](https://nenyax.mintlify.app/api-reference) for the full interactive playground.

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
- [ ] Nenyax Cloud (managed platform)

---

## Contributing

We welcome contributions from the community. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, and read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

<div align="center">

#### Voice infrastructure powered by [Resemble AI](https://www.resemble.ai)

</div>

---

## License

Nenyax is open-source software licensed under the [GNU Affero General Public License v3.0](LICENSE).

This means you can freely use, modify, and distribute Nenyax, but any modifications to the codebase must also be made available under the same license — including when running a modified version as a network service.

For commercial licensing inquiries, contact [hello@nenyax.ai](mailto:hello@nenyax.ai).
