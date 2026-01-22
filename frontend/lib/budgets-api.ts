// budgets-api.ts
// API client for budget operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Budget interfaces matching backend models
export interface Budget {
  id: string;
  user_id: string;
  month: string; // YYYY-MM format
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  month: string; // YYYY-MM format
}

export interface BudgetUpdate {
  month?: string;
}

// Helper to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Helper to build headers
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get all budgets for the current user
 */
export async function getBudgets(): Promise<Budget[]> {
  const response = await fetch(`${API_BASE_URL}/api/budgets/`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to fetch budgets: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a budget by month (YYYY-MM format)
 */
export async function getBudgetByMonth(month: string): Promise<Budget> {
  const response = await fetch(`${API_BASE_URL}/api/budgets/by-month/${month}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to fetch budget for ${month}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific budget by ID
 */
export async function getBudget(id: string): Promise<Budget> {
  const response = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to fetch budget: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new budget
 */
export async function createBudget(data: BudgetCreate): Promise<Budget> {
  const response = await fetch(`${API_BASE_URL}/api/budgets/`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to create budget: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing budget
 */
export async function updateBudget(id: string, data: BudgetUpdate): Promise<Budget> {
  const response = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to update budget: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a budget
 */
export async function deleteBudget(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to delete budget: ${response.statusText}`);
  }
}

/**
 * Get or create a budget for the specified month
 * If budget doesn't exist, creates it automatically
 */
export async function getOrCreateBudget(month: string): Promise<Budget> {
  try {
    // Try to get existing budget
    return await getBudgetByMonth(month);
  } catch (error) {
    // If not found, create new budget
    return await createBudget({ month });
  }
}
