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
  owner_slot: string;
  month: string;
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

function getAuthHeaders(): HeadersInit {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (token) {
    token = token.trim();
    if (token === '') {
      token = null;
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send chat message' }));
    throw new Error(error.detail || 'Failed to send chat message');
  }

  return response.json();
}

/**
 * Confirm a pending action (save proposed budget entries)
 */
export async function confirmBudgetEntries(entries: ProposedEntry[]): Promise<ChatResponse> {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/ai/confirm`, {
    method: 'POST',
    headers,
    body: JSON.stringify(entries),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to confirm entries' }));
    throw new Error(error.detail || 'Failed to confirm entries');
  }

  return response.json();
}

/**
 * Upload a CSV bank statement file for AI processing
 */
export async function uploadCSV(file: File): Promise<ChatResponse> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    token = token.trim();
    if (token === '') token = null;
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/upload-csv`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to upload CSV' }));
    throw new Error(error.detail || 'Failed to upload CSV');
  }

  return response.json();
}
