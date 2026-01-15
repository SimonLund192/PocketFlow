const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

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

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export const api = {
  // Authentication endpoints
  async register(data: RegisterData): Promise<User> {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(errorData.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(errorData.detail || 'Login failed');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 401) {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
      throw new Error('Failed to get current user');
    }
    return res.json();
  },

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
    const res = await fetch(`${API_URL}/api/budget/${month}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch budget');
    return res.json();
  },

  async saveBudget(month: string, budget: Omit<Budget, '_id' | 'month'>): Promise<Budget> {
    const res = await fetch(`${API_URL}/api/budget/${month}`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const res = await fetch(`${API_URL}/api/budget/lifetime/stats`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch lifetime budget stats');
    return res.json();
  },

  // Admin endpoints
  async clearTransactions(): Promise<{ message: string; deleted_count: number }> {
    const res = await fetch(`${API_URL}/api/admin/clear/transactions`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear transactions');
    return res.json();
  },

  async clearBudgets(): Promise<{ message: string; deleted_count: number }> {
    const res = await fetch(`${API_URL}/api/admin/clear/budgets`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear budgets');
    return res.json();
  },

  async clearAllData(): Promise<{ message: string; transactions_deleted: number; budgets_deleted: number; total_deleted: number }> {
    const res = await fetch(`${API_URL}/api/admin/clear/all`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear all data');
    return res.json();
  },
};
