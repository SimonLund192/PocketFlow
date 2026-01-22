const API_BASE_URL = "http://localhost:8000";

export interface Category {
  id: string;  // Backend returns 'id', not '_id'
  user_id: string;
  name: string;
  type: "income" | "shared-expenses" | "personal-expenses" | "shared-savings" | "fun";
  icon: string;
  color: string;
}

export interface CategoryCreate {
  name: string;
  type: "income" | "shared-expenses" | "personal-expenses" | "shared-savings" | "fun";
  icon: string;
  color: string;
}

export interface CategoryUpdate {
  name?: string;
  type?: "income" | "shared-expenses" | "personal-expenses" | "shared-savings" | "fun";
  icon?: string;
  color?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  },

  create: async (category: CategoryCreate): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Failed to create category");
    return response.json();
  },

  update: async (id: string, category: CategoryUpdate): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Failed to update category");
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to delete category");
  },
};
