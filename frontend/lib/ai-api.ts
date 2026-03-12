import { buildAuthHeaders, throwIfUnauthorized } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  session_id?: string;
  dry_run?: boolean;
  confirm_action?: string; // "yes" or "no"
}

export interface ProposedEntry {
  name: string;
  category_name: string;
  category_id: string;
  category_type: string;
  amount: number;
  owner_slot: "user1" | "user2" | "shared";
  month: string;
  source?: "ai";
  needs_review?: boolean;
}

export interface PendingAction {
  action_type: string;
  entries: ProposedEntry[];
  summary: string;
}

export interface ChatResponse {
  message: ChatMessage;
  tool_calls: any[];
  warnings: string[];
  pending_action?: PendingAction | null;
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(request),
  });

  await throwIfUnauthorized(response, 'Failed to send chat message');

  return response.json();
}

/**
 * Confirm a pending action (save proposed budget entries)
 */
export async function confirmBudgetEntries(entries: ProposedEntry[]): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/confirm`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(entries),
  });

  await throwIfUnauthorized(response, 'Failed to confirm entries');

  return response.json();
}

/**
 * Upload a CSV bank statement file for AI processing
 */
export async function uploadCSV(file: File): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/ai/upload-csv`, {
    method: 'POST',
    headers: buildAuthHeaders(false),
    body: formData,
  });

  await throwIfUnauthorized(response, 'Failed to upload CSV');

  return response.json();
}

export interface DemoSeedSummary {
  categories_created: number;
  budgets_created: number;
  line_items_created: number;
  goals_created: number;
}

export interface DemoSeedResponse {
  message: string;
  summary: DemoSeedSummary;
}

/**
 * Seed the current user's account with demo budget data
 */
export async function seedDemoData(): Promise<DemoSeedResponse> {
  const response = await fetch(`${API_BASE_URL}/api/demo/seed`, {
    method: 'POST',
    headers: buildAuthHeaders(),
  });

  await throwIfUnauthorized(response, 'Failed to seed demo data');

  return response.json();
}
