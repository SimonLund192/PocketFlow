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

export interface BudgetItem {
  id: string;
  value: number;
  user?: string;
}

export interface Budget {
  _id?: string;
  month: string;
  income_user1: BudgetItem[];
  income_user2: BudgetItem[];
  shared_expenses: BudgetItem[];
  personal_user1: BudgetItem[];
  personal_user2: BudgetItem[];
  shared_savings: BudgetItem[];
  personal_savings_user1: BudgetItem[];
  personal_savings_user2: BudgetItem[];
}

export interface BudgetLifetimeStats {
  total_income: number;
  total_shared_expenses: number;
  total_personal_expenses: number;
  total_shared_savings: number;
  remaining: number;
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

  async getBudget(month: string): Promise<Budget> {
    const res = await fetch(`${API_URL}/api/budget/${month}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch budget');
    return res.json();
  },

  async saveBudget(month: string, budget: Omit<Budget, '_id' | 'month'>): Promise<Budget> {
    const res = await fetch(`${API_URL}/api/budget/${month}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('Save budget error:', errorData);
      throw new Error(`Failed to save budget: ${JSON.stringify(errorData)}`);
    }
    return res.json();
  },

  async getBudgetLifetimeStats(): Promise<BudgetLifetimeStats> {
    const res = await fetch(`${API_URL}/api/budget/lifetime/stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch lifetime budget stats');
    return res.json();
  },
};
