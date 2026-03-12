import { buildAuthHeaders, getStoredToken, throwIfUnauthorized } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    const token = getStoredToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: buildAuthHeaders(false),
    });

    await throwIfUnauthorized(response, "Failed to fetch profile");
    return response.json();
  },

  updateProfile: async (data: UserUpdate): Promise<UserProfile> => {
    const token = getStoredToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "PATCH",
      headers: buildAuthHeaders(),
      body: JSON.stringify(data),
    });

    await throwIfUnauthorized(response, "Failed to update profile");
    return response.json();
  },
};
