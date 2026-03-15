# Arkenos API Contracts

## Auth
All /api/* endpoints require Clerk JWT in Authorization header
Except: /api/livekit/webhook, /health

## Endpoints

### Agents
GET    /api/agents        → { agents: Agent[], total: number }
POST   /api/agents        → Agent
GET    /api/agents/:id    → Agent
PUT    /api/agents/:id    → Agent
DELETE /api/agents/:id    → { success: boolean }

Agent: { id, name, systemPrompt, sttProvider,
         llmProvider, ttsProvider, createdAt, updatedAt }

### Sessions
GET /api/sessions         → { sessions: Session[], total: number }
  Query params: page, limit, start_date, end_date, direction (inbound|outbound)
GET /api/sessions/:id     → Session
GET /api/sessions/:id/analysis → CallAnalysis | null

Session: { id, agentId, startedAt, endedAt, transcript, duration, analysis?, direction?,
           transferredTo?, transferType?, transferTimestamp? }

CallAnalysis: { summary, sentiment, sentiment_score, topics, outcome, action_items }

### Call Transfer
POST /api/sessions/:id/transfer → TransferResponse
Body: { phone_number: string (E.164), type: "warm" | "cold" }

TransferResponse: { session_id, transfer_type, transferred_to, status, message }

### LiveKit
POST /api/livekit/token   → { token: string, roomName: string }
Body: { agentId, roomName }

### Usage
POST /api/usage/events   → UsageEvent
Body: { session_id, user_id, agent_id?, event_type, provider, usage_data }

event_type: "stt_minutes" | "llm_tokens" | "tts_characters"
usage_data (stt_minutes):    { audio_duration_seconds: float }
usage_data (llm_tokens):     { input_tokens: int, output_tokens: int }
usage_data (tts_characters): { character_count: int }

UsageEvent: { id, session_id, user_id, agent_id?, event_type, provider, usage_data, created_at }

### Dashboard
GET /api/dashboard/metrics → {
  totalSessions, totalAgents,
  avgDuration, sessionsToday,
  transcriptsToday
}

### Outbound Calls
POST /api/calls/outbound   → OutboundCallResponse
Body: { agent_id, phone_number (E.164), callback_url? }
Headers: x-user-id (Clerk ID)

OutboundCallResponse: { call_id, room_name, status }

GET /api/calls/:id/status  → CallStatusResponse

CallStatusResponse: { call_id, status, call_status, call_direction,
                      outbound_phone_number, room_name, started_at,
                      ended_at, duration }

POST /api/calls/:id/end   → { success: boolean, call_id: string }
Headers: x-user-id (Clerk ID)
Ends an active outbound call.

### Phone Numbers
Note: buy/assign/release endpoints auto-provision both LiveKit SIP infrastructure
(inbound trunk, dispatch rule) and telephony provider SIP trunk (origination to LiveKit).
No webhook or BACKEND_URL needed — provider routes directly to LiveKit via SIP.
All endpoints accept an optional `provider` parameter (default: "twilio"). Supported: twilio, telnyx.

GET  /api/telephony/numbers/search?country=US&area_code=512&limit=10&provider=twilio → NumberSearchResult[]
POST /api/telephony/numbers/buy → BuyNumberResponse
Body: { agent_id, phone_number, provider?: "twilio" }
BuyNumberResponse: { phone_number, provider_number_sid, agent_id }

POST /api/telephony/numbers/assign → { status, phone_number, provider_number_sid?, agent_id }
Body: { agent_id, phone_number (E.164), provider?: "twilio" }

POST /api/telephony/numbers/release → { status, phone_number }
Body: { agent_id }

POST /api/telephony/numbers/provision → ProvisionResult
Body: { agent_id }
ProvisionResult: { status: "ready"|"partial"|"error", phone_number, agent_id, steps: [{ step, status, detail }] }

Session (updated): { ..., call_direction?: "INBOUND"|"OUTBOUND",
                     outbound_phone_number?: string,
                     call_status?: "RINGING"|"ANSWERED"|"COMPLETED"|"FAILED"|"NO_ANSWER" }

### Phone Number Reassignment
GET  /api/telephony/numbers/check?phone_number=+1234567890 → NumberCheckResponse
  Checks globally (all users) if any agent has this number assigned.

NumberCheckResponse: { assigned: boolean, agent_id?: string, agent_name?: string, user_id?: string }

POST /api/telephony/numbers/reassign → ReassignNumberResponse
Body: { phone_number: string (E.164), target_agent_id: string }
  Atomically releases number from source agent (if any) and assigns to target.
  Auto-provisions full SIP pipeline after assignment. Carries over source agent's provider.

ReassignNumberResponse: { phone_number, provider_number_sid?, target_agent_id, source_agent_id?, source_agent_name?, pipeline_result? }
  pipeline_result: { status: "ready"|"partial"|"error", steps: [{ step, status, detail }] }

### Usage Events (agent worker → backend)
POST /api/usage/events    → UsageEvent
Body: { session_id, user_id, agent_id, provider, event_type, quantity, unit_cost, total_cost }

UsageEvent: { id, session_id, user_id, agent_id, provider, event_type, quantity, unit_cost, total_cost, created_at }

event_type enum: stt_minutes | llm_tokens | tts_characters

### Costs (dashboard read endpoints)
GET /api/costs/summary                          → CostSummary
GET /api/costs/timeline?period=daily&start_date=&end_date= → TimelinePoint[]
GET /api/costs/by-agent                         → AgentCost[]
GET /api/sessions/:id/cost-breakdown            → SessionCostBreakdown

CostSummary: { total_cost, this_month_cost, by_provider: { [provider]: cost } }
TimelinePoint: { date, total_cost, by_provider: { [provider]: cost } }
AgentCost: { agent_id, agent_name, total_cost, session_count, event_count }
SessionCostBreakdown: { session_id, total_cost, events: UsageEvent[], cost_by_type: { [event_type]: cost } }

### Settings (API Key Management)

GET /api/settings/keys → KeyStatusResponse
  Returns status of all API keys (set/missing, source). Never returns actual secret values.

KeyStatusResponse: {
  providers: { [provider_id]: ProviderStatus },
  all_required_set: boolean,
  stt_configured: boolean,
  telephony_configured: boolean
}
ProviderStatus: { label: string, required: boolean, configured: boolean, keys: { [key_name]: KeyInfo } }
KeyInfo: { status: "set" | "missing", source: "db" | "env" | null }

POST /api/settings/keys → { status: "saved", key: string }
Body: { key_name: string, value: string }
  Save a single API key (encrypted in DB). key_name must be a known key.

POST /api/settings/keys/bulk → { status: "saved", keys: string[] }
Body: { keys: { [key_name]: value } }
  Save multiple API keys at once. Unknown key names are silently skipped. Empty values are skipped.

DELETE /api/settings/keys/{key_name} → { status: "deleted", key: string }
  Delete a key from the DB. Falls back to .env if one exists. Returns 404 if key not in DB.

GET /api/settings/keys/agent → { [key_name]: decrypted_value }
  Internal only. Returns all decrypted keys for agent worker boot. Do not call from frontend.

POST /api/settings/test/{provider} → TestResult
Body (optional): { keys?: { [key_name]: value } }
  Test connection to a provider. If body.keys is provided, those values override DB/env keys
  (allows testing before saving). Supported providers: livekit, google, resemble, assemblyai,
  deepgram, elevenlabs, twilio, telnyx.

TestResult: { provider: string, success: boolean, message: string }

### Telephony Lookup (internal)

GET /api/telephony/lookup?phone_number=+1234567890 → AgentLookup
  Internal only. Used by the agent worker for SIP dispatch to find which agent owns a phone number.
  Matches against all active agents using normalized phone comparison.

AgentLookup: { agent_id: string, name: string, config: object }
  Returns 404 if no active agent found for the number.

### Cost Rates (configurable)
- Deepgram STT: $0.0043/min
- AssemblyAI STT: $0.0085/min
- ElevenLabs STT: $0.0069/min
- Gemini LLM: $0.000075/1K tokens
- Resemble TTS: $0.0003/char

## Rules
- Change an endpoint → update this file first
- Frontend must match these shapes exactly
- QA agent validates responses against these shapes