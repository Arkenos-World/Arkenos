import posthog from "posthog-js";

function isEnabled() {
  return process.env.NEXT_PUBLIC_TELEMETRY !== "false";
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!isEnabled()) return;
  posthog.capture(event, properties);
}

// Auth
export function trackSignUp() {
  trackEvent("user_signed_up");
}

export function trackSignIn() {
  trackEvent("user_signed_in");
}

// Agents
export function trackAgentCreated(mode: string) {
  trackEvent("agent_created", { mode });
}

export function trackAgentDeleted() {
  trackEvent("agent_deleted");
}

// Calls
export function trackCallStarted(agentId: string) {
  trackEvent("call_started", { agent_id: agentId });
}

export function trackCallEnded(agentId: string, durationSeconds?: number) {
  trackEvent("call_ended", { agent_id: agentId, duration_seconds: durationSeconds });
}

// API Keys
export function trackApiKeyConfigured(provider: string) {
  trackEvent("api_key_configured", { provider });
}

export function trackProviderTestConnection(provider: string, success: boolean) {
  trackEvent("provider_test_connection", { provider, success });
}
