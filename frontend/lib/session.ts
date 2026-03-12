const AUTH_INVALID_EVENT = "pocketflow:auth-invalid";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token")?.trim() || "";
  return token || null;
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
}

export function onAuthInvalid(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(AUTH_INVALID_EVENT, handler);
  return () => window.removeEventListener(AUTH_INVALID_EVENT, handler);
}

export function buildAuthHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) {
    headers["Content-Type"] = "application/json";
  }

  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function throwIfUnauthorized(response: Response, fallbackMessage: string) {
  if (response.status === 401) {
    clearStoredSession();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: fallbackMessage }));
    throw new Error(error.detail || fallbackMessage);
  }
}
