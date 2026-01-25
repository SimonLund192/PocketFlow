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
}

export interface ChatResponse {
  message: ChatMessage;
  tool_calls: any[];
  warnings: string[];
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  // Get the token from localStorage
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Clean up the token - remove any whitespace
  if (token) {
    token = token.trim();
    // If token is empty after trimming, set it to null
    if (token === '') {
      token = null;
    }
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Only add Authorization header if we have a valid token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send chat message' }));
    throw new Error(error.detail || 'Failed to send chat message');
  }
  
  return response.json();
}
