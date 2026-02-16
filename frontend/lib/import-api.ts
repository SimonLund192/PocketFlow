// import-api.ts
// API client for CSV bank statement import operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ---------- Types ----------

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  is_expense: boolean;
  abs_amount: number;
  category_id: string | null;
  owner_slot: 'user1' | 'user2' | 'shared';
  include: boolean;
}

export interface UploadResponse {
  rows: ParsedRow[];
  count: number;
  header: string[];
  delimiter: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

export interface ConfirmEntry {
  name: string;
  category_id: string;
  amount: number;
  owner_slot: 'user1' | 'user2' | 'shared';
}

export interface ConfirmResponse {
  saved_count: number;
  error_count: number;
  saved: Array<{ id: string; name: string; amount: number; category: string }>;
  errors: string[];
}

// ---------- Helpers ----------

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function buildHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ---------- API calls ----------

/**
 * Upload a CSV file for parsing.
 */
export async function uploadCSVFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/import/upload`, {
    method: 'POST',
    headers: buildHeaders(false), // no Content-Type — browser sets multipart boundary
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return response.json();
}

/**
 * Upload CSV content as raw text (paste from clipboard).
 */
export async function uploadCSVText(csvContent: string): Promise<UploadResponse> {
  const response = await fetch(`${API_BASE_URL}/api/import/upload-text`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ csv_content: csvContent }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return response.json();
}

/**
 * Get user categories for the mapping step.
 */
export async function getImportCategories(): Promise<CategoryOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/import/categories`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to fetch categories' }));
    throw new Error(err.detail || 'Failed to fetch categories');
  }
  return response.json();
}

/**
 * Confirm and save mapped entries as budget line items.
 */
export async function confirmImport(
  month: string,
  entries: ConfirmEntry[]
): Promise<ConfirmResponse> {
  const response = await fetch(`${API_BASE_URL}/api/import/confirm`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ month, entries }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Import failed' }));
    throw new Error(err.detail || 'Import failed');
  }
  return response.json();
}
