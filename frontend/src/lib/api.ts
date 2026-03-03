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
  direction?: "inbound" | "outbound" | null;
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
  twilio_sid: string | null;
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
