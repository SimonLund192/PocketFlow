const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface DashboardStats {
  net_income: number;
  total_savings: number;
  total_expenses: number;
  goals_achieved: number;
  period_change_percentage: number;
  last_month_net_income: number;
}

export interface BalanceTrend {
  date: string;
  balance: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_URL}/api/dashboard/stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getBalanceTrends(): Promise<BalanceTrend[]> {
    const res = await fetch(`${API_URL}/api/dashboard/balance-trends`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch balance trends');
    return res.json();
  },

  async getExpenseBreakdown(): Promise<ExpenseBreakdown[]> {
    const res = await fetch(`${API_URL}/api/dashboard/expense-breakdown`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch expense breakdown');
    return res.json();
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_URL}/api/transactions`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },
};
