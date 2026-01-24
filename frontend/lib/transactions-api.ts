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
};
