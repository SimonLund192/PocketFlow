const API_BASE_URL = "http://localhost:8000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const adminApi = {
  clearTransactions: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-transactions`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to clear transactions");
    return response.json();
  },

  clearBudgets: async (): Promise<{ message: string; budgets_deleted: number; line_items_deleted: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-budgets`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to clear budgets");
    return response.json();
  },

  clearCategories: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-categories`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to clear categories");
    return response.json();
  },

  clearGoals: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-goals`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to clear goals");
    return response.json();
  },

  clearAllData: async (): Promise<{
    message: string;
    transactions_deleted: number;
    budgets_deleted: number;
    line_items_deleted: number;
    categories_deleted: number;
    goals_deleted: number;
    total_deleted: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-all`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to clear all data");
    return response.json();
  },
};
