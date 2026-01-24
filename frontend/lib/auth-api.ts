const API_BASE_URL = "http://localhost:8000";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  partner_name?: string;
}

export interface UserUpdate {
  full_name?: string;
  partner_name?: string;
}

export const authApi = {
  getProfile: async (): Promise<UserProfile> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch profile");
    }
    return response.json();
  },

  updateProfile: async (data: UserUpdate): Promise<UserProfile> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update profile");
    }
    return response.json();
  },
};
