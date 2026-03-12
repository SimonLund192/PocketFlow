// budget-line-items-api.ts
// API client for budget line item operations
import { buildAuthHeaders, throwIfUnauthorized } from "@/lib/session";

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
    type: 'income' | 'expense' | 'savings' | 'fun';
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

export interface BudgetDraftRowPayload {
  id?: string;
  name: string;
  category_id: string;
  amount: number;
  owner_slot: 'user1' | 'user2' | 'shared';
  include: boolean;
  source: 'existing' | 'manual' | 'ai' | 'import' | 'copied';
  needs_review: boolean;
}

export interface SaveBudgetDraftRequest {
  month: string;
  rows: BudgetDraftRowPayload[];
  deleted_ids: string[];
}

export interface SaveBudgetDraftResponse {
  budget: {
    id: string;
    user_id: string;
    month: string;
    created_at: string;
    updated_at: string;
  };
  rows: Array<BudgetDraftRowPayload & {
    category?: {
      id: string;
      name: string;
      type: 'income' | 'expense' | 'savings' | 'fun';
      icon: string;
      color: string;
    };
  }>;
  removed_ids: string[];
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
    headers: buildAuthHeaders(),
  });

  await throwIfUnauthorized(response, `Failed to fetch budget line items: ${response.statusText}`);

  return response.json();
}

/**
 * Get budget line items by budget ID (populated with category info)
 */
export async function getBudgetLineItemsByBudget(budgetId: string): Promise<BudgetLineItemWithCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/budget/${budgetId}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  await throwIfUnauthorized(response, `Failed to fetch budget line items: ${response.statusText}`);

  return response.json();
}

/**
 * Get a specific budget line item by ID
 */
export async function getBudgetLineItem(id: string): Promise<BudgetLineItem> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/${id}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  await throwIfUnauthorized(response, `Failed to fetch budget line item: ${response.statusText}`);

  return response.json();
}

/**
 * Create a new budget line item
 */
export async function createBudgetLineItem(data: BudgetLineItemCreate): Promise<BudgetLineItem> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });

  await throwIfUnauthorized(response, `Failed to create budget line item: ${response.statusText}`);

  return response.json();
}

/**
 * Update an existing budget line item
 */
export async function updateBudgetLineItem(id: string, data: BudgetLineItemUpdate): Promise<BudgetLineItem> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });

  await throwIfUnauthorized(response, `Failed to update budget line item: ${response.statusText}`);

  return response.json();
}

/**
 * Delete a budget line item
 */
export async function deleteBudgetLineItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });

  await throwIfUnauthorized(response, `Failed to delete budget line item: ${response.statusText}`);
}

export async function saveBudgetDraft(
  data: SaveBudgetDraftRequest,
): Promise<SaveBudgetDraftResponse> {
  const response = await fetch(`${API_BASE_URL}/api/budget-line-items/draft`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });

  await throwIfUnauthorized(response, `Failed to save budget draft: ${response.statusText}`);

  return response.json();
}
