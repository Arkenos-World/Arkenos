/**
 * Resolve the backend API base URL.
 * Accepts URLs with or without the /api suffix so Render's fromService
 * (which gives just the host) works automatically.
 */
export function getApiUrl(): string {
  const raw =
    (typeof window === "undefined"
      ? process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:8000/api";
  return raw.endsWith("/api") ? raw : `${raw.replace(/\/+$/, "")}/api`;
}

export interface CallAnalysis {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  topics: string[];
  outcome: "resolved" | "unresolved" | "transferred" | "escalated";
  action_items: string[];
}

export interface VoiceSession {
  id: string;
  room_name: string;
  status: "CREATED" | "ACTIVE" | "COMPLETED" | "FAILED" | string;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  user_id: string;
  agent_id: string | null;
  agent_name?: string | null;
  analysis?: CallAnalysis | null;
  call_direction?: "INBOUND" | "OUTBOUND" | null;
  outbound_phone_number?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SessionsPage {
  sessions: VoiceSession[];
  total: number;
  page: number;
  limit: number;
}

export interface CostSummary {
  total_cost: number;
  this_month_cost: number;
  avg_cost_per_call: number;
  total_calls: number;
}

export interface ProviderCost {
  provider: string;
  cost: number;
  calls: number;
}

export interface CostTimelineEntry {
  date: string;
  costs: Record<string, number>;
  total: number;
}

export interface AgentCost {
  agent_id: string;
  agent_name: string;
  calls: number;
  total_cost: number;
  avg_cost_per_call: number;
}

export interface SessionCostBreakdown {
  provider: string;
  service: string;
  units: number;
  unit_label: string;
  cost: number;
}

export interface SessionCosts {
  session_id: string;
  total_cost: number;
  breakdown: SessionCostBreakdown[];
}

export type TransferType = "warm" | "cold";

export type TransferStatus =
  | "initiating"
  | "ringing"
  | "connected"
  | "completed"
  | "failed";

export interface Transfer {
  id: string;
  session_id: string;
  phone_number: string;
  transfer_type: TransferType;
  status: TransferStatus;
  initiated_at: string;
  connected_at: string | null;
  completed_at: string | null;
  initiated_by: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  user_id: string;
  phone_number: string | null;
  provider_number_sid: string | null;
  telephony_provider?: string | null;
  agent_mode: "STANDARD" | "CUSTOM";
  storage_path: string | null;
  image_tag: string | null;
  build_status: "NONE" | "PENDING" | "BUILDING" | "READY" | "FAILED";
  current_version: number;
  deployed_version: number | null;
  created_at: string;
  updated_at: string;
}

export interface AgentFile {
  id: string;
  agent_id: string;
  file_path: string;
  content_hash: string;
  size_bytes: number;
  mime_type: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ContainerInfo {
  id: string;
  agent_id: string;
  session_id: string | null;
  container_id: string | null;
  container_type: string;
  status: "PENDING" | "RUNNING" | "STOPPED" | "FAILED";
  image_tag: string | null;
  started_at: string | null;
  stopped_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface BuildStatus {
  status: "NONE" | "PENDING" | "BUILDING" | "READY" | "FAILED";
  image_tag: string | null;
  build_log: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface CodingAgentMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  file_changes?: {
    file_path: string;
    action: "create" | "modify" | "delete";
    content?: string;
  }[];
  timestamp: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: CodingAgentMessage[];
  created_at: string;
  updated_at: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

// --- Settings / API Keys ---

export interface KeyInfo {
  status: "set" | "missing";
  source: "db" | "env" | null;
}

export interface ProviderStatus {
  label: string;
  required: boolean;
  configured: boolean;
  keys: Record<string, KeyInfo>;
}

export interface KeyStatusResponse {
  providers: Record<string, ProviderStatus>;
  all_required_set: boolean;
  stt_configured: boolean;
  telephony_configured: boolean;
}

export interface TestResult {
  provider: string;
  success: boolean;
  message: string;
}

export async function getKeyStatus(): Promise<KeyStatusResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/settings/keys`);
  if (!res.ok) throw new Error("Failed to fetch key status");
  return res.json();
}

export async function saveKeys(keys: Record<string, string>): Promise<void> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/settings/keys/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
  });
  if (!res.ok) throw new Error("Failed to save keys");
}

export async function deleteKey(keyName: string): Promise<void> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/settings/keys/${keyName}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete key");
}

export async function testProvider(provider: string, keys?: Record<string, string>): Promise<TestResult> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/settings/test/${provider}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys: keys || null }),
  });
  if (!res.ok) throw new Error("Failed to test provider");
  return res.json();
}

// --- Telephony ---

export interface NumberSearchResult {
  phone_number: string;
  friendly_name: string;
  locality?: string;
  region?: string;
  iso_country?: string;
}

export interface BuyNumberResponse {
  phone_number: string;
  provider_number_sid: string;
  agent_id: string;
}

export interface NumberCheckResponse {
  assigned: boolean;
  agent_id?: string;
  agent_name?: string;
  user_id?: string;
}

export interface AssignNumberResponse {
  status: string;
  phone_number: string;
  provider_number_sid?: string;
  agent_id: string;
}

export interface ReassignNumberResponse {
  phone_number: string;
  provider_number_sid?: string;
  target_agent_id: string;
  source_agent_id?: string;
  source_agent_name?: string;
  pipeline_result?: {
    status: string;
    steps: { step: string; status: string; detail: string }[];
  };
}

export interface ReleaseNumberResponse {
  status: string;
  phone_number: string;
}

export interface ProvisionResult {
  status: "ready" | "partial" | "error";
  phone_number: string;
  agent_id: string;
  steps: { step: string; status: string; detail: string }[];
}

export async function searchPhoneNumbers(
  provider: string,
  areaCode?: string,
  limit?: number,
): Promise<NumberSearchResult[]> {
  const apiUrl = getApiUrl();
  const params = new URLSearchParams({ provider });
  if (areaCode) params.set("area_code", areaCode);
  if (limit != null) params.set("limit", String(limit));
  const res = await fetch(`${apiUrl}/telephony/numbers/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function buyPhoneNumber(
  agentId: string,
  phoneNumber: string,
  provider: string,
): Promise<BuyNumberResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/telephony/numbers/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, phone_number: phoneNumber, provider }),
  });
  if (!res.ok) throw new Error("Purchase failed");
  return res.json();
}

export async function checkNumberAssignment(
  phoneNumber: string,
): Promise<NumberCheckResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(
    `${apiUrl}/telephony/numbers/check?phone_number=${encodeURIComponent(phoneNumber)}`,
  );
  if (!res.ok) throw new Error("Number check failed");
  return res.json();
}

export async function assignPhoneNumber(
  agentId: string,
  phoneNumber: string,
  provider: string,
): Promise<AssignNumberResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/telephony/numbers/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, phone_number: phoneNumber, provider }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Assign failed");
  }
  return res.json();
}

export async function reassignPhoneNumber(
  phoneNumber: string,
  targetAgentId: string,
  provider: string,
): Promise<ReassignNumberResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/telephony/numbers/reassign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber, target_agent_id: targetAgentId, provider }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Reassign failed");
  }
  return res.json();
}

export async function releasePhoneNumber(
  agentId: string,
): Promise<ReleaseNumberResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/telephony/numbers/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });
  if (!res.ok) throw new Error("Release failed");
  return res.json();
}

export async function provisionPhoneNumber(
  agentId: string,
  provider: string,
): Promise<ProvisionResult> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/telephony/numbers/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, provider }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Pipeline check failed");
  return data;
}
