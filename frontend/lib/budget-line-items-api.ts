// budget-line-items-api.ts
// API client for budget line item operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Budget line item interfaces matching backend models
export interface BudgetLineItem {
  id: string;
  user_id: string;
  budget_id: string;
  name: string;
  category_id: string;
  amount: number;
  owner_slot: 'user1' | 'user2' | 'shared';
  created_at: string;
  updated_at: string;
}

export interface BudgetLineItemWithCategory extends BudgetLineItem {
  category?: {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'savings';
    icon: string;
    color: string;
  };
}

export interface BudgetLineItemCreate {
  budget_id: string;
  name: string;
  category_id: string;
  amount: number;
  owner_slot: 'user1' | 'user2' | 'shared';
}

export interface BudgetLineItemUpdate {
  name?: string;
  category_id?: string;
  amount?: number;
  owner_slot?: 'user1' | 'user2' | 'shared';
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
 * Get all budget line items (optionally filtered by budget_id)
 */
export async function getBudgetLineItems(budgetId?: string): Promise<BudgetLineItem[]> {
  const url = budgetId
    ? `${API_BASE_URL}/api/budget-line-items/?budget_id=${budgetId}`
    : `${API_BASE_URL}/api/budget-line-items/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to fetch budget line items: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get budget line items by budget ID (populated with category info)
 */
export async function getBudgetLineItemsByBudget(budgetId: string): Promise<BudgetLineItemWithCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/budget/${budgetId}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to fetch budget line items: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific budget line item by ID
 */
export async function getBudgetLineItem(id: string): Promise<BudgetLineItem> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to fetch budget line item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new budget line item
 */
export async function createBudgetLineItem(data: BudgetLineItemCreate): Promise<BudgetLineItem> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to create budget line item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing budget line item
 */
export async function updateBudgetLineItem(id: string, data: BudgetLineItemUpdate): Promise<BudgetLineItem> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to update budget line item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a budget line item
 */
export async function deleteBudgetLineItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Failed to delete budget line item: ${response.statusText}`);
  }
}
