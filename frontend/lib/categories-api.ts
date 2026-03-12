import { buildAuthHeaders, throwIfUnauthorized } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Category {
  id: string;  // Backend returns 'id', not '_id'
  user_id: string;
  name: string;
  type: "income" | "expense" | "savings" | "fun";
  icon: string;
  color: string;
}

export interface CategoryCreate {
  name: string;
  type: "income" | "expense" | "savings" | "fun";
  icon: string;
  color: string;
}

export interface CategoryUpdate {
  name?: string;
  type?: "income" | "expense" | "savings" | "fun";
  icon?: string;
  color?: string;
}

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/`, {
      headers: buildAuthHeaders(),
      credentials: 'include',
    });
    await throwIfUnauthorized(response, "Failed to fetch categories");
    return response.json();
  },

  create: async (category: CategoryCreate): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/`, {
      method: "POST",
      headers: buildAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(category),
    });
    await throwIfUnauthorized(response, "Failed to create category");
    return response.json();
  },

  update: async (id: string, category: CategoryUpdate): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(category),
    });
    await throwIfUnauthorized(response, "Failed to update category");
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: buildAuthHeaders(),
      credentials: 'include',
    });
    await throwIfUnauthorized(response, "Failed to delete category");
  },

  seedDefaults: async (): Promise<{ message: string; inserted: number; skipped: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/seed-defaults`, {
      method: "POST",
      headers: buildAuthHeaders(),
      credentials: 'include',
    });
    await throwIfUnauthorized(response, "Failed to seed default categories");
    return response.json();
  },
};
