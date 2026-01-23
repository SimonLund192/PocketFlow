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
  // Get the token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return response.json();
}

/**
 * Fetch balance trends for chart
 */
export async function getBalanceTrends(): Promise<BalanceTrend[]> {
  // Get the token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard/balance-trends`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch balance trends");
  }
  return response.json();
}

/**
 * Fetch expense breakdown
 */
export async function getExpenseBreakdown(): Promise<ExpenseBreakdown[]> {
  // Get the token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard/expense-breakdown`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch expense breakdown");
  }
  return response.json();
}
