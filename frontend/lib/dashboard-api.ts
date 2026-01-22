const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DashboardStats {
  net_income: number;
  savings: number;
  expenses: number;
  goals_achieved: number;
  income_change: number;
  savings_change: number;
  expenses_change: number;
}

export interface BalanceTrend {
  month: string;
  personal: number;
  shared: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Fetch dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return response.json();
}

/**
 * Fetch balance trends for chart
 */
export async function getBalanceTrends(): Promise<BalanceTrend[]> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/balance-trends`);
  if (!response.ok) {
    throw new Error("Failed to fetch balance trends");
  }
  return response.json();
}

/**
 * Fetch expense breakdown
 */
export async function getExpenseBreakdown(): Promise<ExpenseBreakdown[]> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/expense-breakdown`);
  if (!response.ok) {
    throw new Error("Failed to fetch expense breakdown");
  }
  return response.json();
}
