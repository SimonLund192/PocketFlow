// import-api.ts
// API client for CSV bank statement import operations
import { buildAuthHeaders, throwIfUnauthorized } from "@/lib/session";

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
  suggestion_confidence?: number | null;
  suggestion_basis?: string | null;
  matched_terms?: string[];
  matched_example?: string | null;
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

// ---------- API calls ----------

/**
 * Upload a CSV file for parsing.
 */
export async function uploadCSVFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/import/upload`, {
    method: 'POST',
    headers: buildAuthHeaders(false),
    body: formData,
  });

  await throwIfUnauthorized(response, 'Upload failed');
  return response.json();
}

/**
 * Upload CSV content as raw text (paste from clipboard).
 */
export async function uploadCSVText(csvContent: string): Promise<UploadResponse> {
  const response = await fetch(`${API_BASE_URL}/api/import/upload-text`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ csv_content: csvContent }),
  });

  await throwIfUnauthorized(response, 'Upload failed');
  return response.json();
}

/**
 * Get user categories for the mapping step.
 */
export async function getImportCategories(): Promise<CategoryOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/import/categories`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  await throwIfUnauthorized(response, 'Failed to fetch categories');
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
    headers: buildAuthHeaders(),
    body: JSON.stringify({ month, entries }),
  });

  await throwIfUnauthorized(response, 'Import failed');
  return response.json();
}
