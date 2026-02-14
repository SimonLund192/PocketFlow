const API_BASE_URL = "http://localhost:8000/api";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: "income" | "expense" | "savings" | "fun";
  description?: string;
  date: string;
}

export const transactionsApi = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    if (!response.ok) {
        throw new Error("Failed to fetch transactions");
    }
    return response.json();
  },
  create: async (payload: Omit<Transaction, "id">): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create transaction");
    }

    return response.json();
  },
};
