const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

// Dev-only user context contract:
// The backend requires an explicit user identifier via `X-User-Id` on all
// user-scoped endpoints (until real auth is enforced end-to-end).
const USER_ID_STORAGE_KEY = 'selected_user_id';

export const getSelectedUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_STORAGE_KEY);
};

export const setSelectedUserId = (userId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
};

const getUserContextHeaders = (): HeadersInit => {
  const userId = getSelectedUserId();
  return userId ? { 'X-User-Id': userId } : {};
};

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
  Object.assign(headers, getUserContextHeaders());
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export type ApiError = {
  status: number;
  detail: string;
  url: string;
  data?: unknown;
};

const isJsonResponse = (res: Response) => {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
};

const safeParseJson = async <T>(res: Response): Promise<T | undefined> => {
  if (!isJsonResponse(res)) return undefined;
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
};

const buildApiError = async (res: Response, url: string, fallbackDetail: string): Promise<ApiError> => {
  const data = await safeParseJson<any>(res);
  const detail = (data && (data.detail || data.message)) ? String(data.detail || data.message) : fallbackDetail;
  return {
    status: res.status,
    detail,
    url,
    data,
  };
};

const requestJson = async <T>(path: string, init: RequestInit = {}, fallbackError: string): Promise<T> => {
  const url = `${API_URL}${path}`;

  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...(init.headers || {}),
  };

  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers,
  });

  if (!res.ok) {
    throw await buildApiError(res, url, fallbackError);
  }

  // Normalize empty-body successes (e.g. 204) to `null`.
  if (res.status === 204) {
    return null as unknown as T;
  }

  const data = await safeParseJson<T>(res);
  return (data ?? (null as unknown as T));
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
  shared_savings: number;
  personal_savings: number;
}

export interface SavingsTrend {
  month: string;
  shared_savings: number;
  personal_savings: number;
  total_savings: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  type: 'shared' | 'personal';
}

export interface BudgetItem {
  id: string;
  name?: string;
  category?: string;
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

export interface MonthlyStats {
  current_income: number;
  current_expenses: number;
  current_savings: number;
  previous_income: number;
  previous_expenses: number;
  previous_savings: number;
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

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'savings';
  created_at?: string;
}

export interface CategoryCreate {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'savings';
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense';
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  saved: number;
  target: number;
  percentage: number;
  color: string;
  order: number;
  created_at: string;
}

export interface GoalCreate {
  name: string;
  target: number;
  saved?: number;
  color?: string;
}

export interface GoalUpdate {
  name?: string;
  saved?: number;
  target?: number;
  color?: string;
  order?: number;
}

export const api = {
  // Dev-only user endpoints
  async listUsers(): Promise<User[]> {
    return requestJson<User[]>('/api/users', { method: 'GET' }, 'Failed to fetch users');
  },

  async createUser(data: RegisterData): Promise<User> {
    // Backend expects the same payload as the register endpoint.
    return requestJson<User>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      'Failed to create user'
    );
  },

  // Authentication endpoints
  async register(data: RegisterData): Promise<User> {
    return requestJson<User>(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Registration failed'
    );
  },

  async login(credentials: LoginCredentials): Promise<AuthToken> {
    return requestJson<AuthToken>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      },
      'Login failed'
    );
  },

  async getCurrentUser(): Promise<User> {
    try {
      return await requestJson<User>('/api/auth/me', {}, 'Failed to get current user');
    } catch (err: any) {
      if (err?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      throw err;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    return requestJson<DashboardStats>('/api/dashboard/stats', {}, 'Failed to fetch dashboard stats');
  },

  async getBalanceTrends(): Promise<BalanceTrend[]> {
    return requestJson<BalanceTrend[]>('/api/dashboard/balance-trends', {}, 'Failed to fetch balance trends');
  },

  async getSavingsTrends(): Promise<SavingsTrend[]> {
    return requestJson<SavingsTrend[]>('/api/dashboard/savings-trends', {}, 'Failed to fetch savings trends');
  },

  async getExpenseBreakdown(): Promise<ExpenseBreakdown[]> {
    return requestJson<ExpenseBreakdown[]>('/api/dashboard/expense-breakdown', {}, 'Failed to fetch expense breakdown');
  },

  async getBudgetExpenseBreakdown(): Promise<BudgetExpenseBreakdown[]> {
    return requestJson<BudgetExpenseBreakdown[]>(
      '/api/dashboard/budget-expense-breakdown',
      {},
      'Failed to fetch budget expense breakdown'
    );
  },

  async getTransactions(): Promise<Transaction[]> {
    return requestJson<Transaction[]>('/api/transactions', {}, 'Failed to fetch transactions');
  },

  async getBudget(month: string): Promise<Budget> {
    return requestJson<Budget>(`/api/budget/${month}`, {}, 'Failed to fetch budget');
  },

  async saveBudget(month: string, budget: Omit<Budget, '_id' | 'month'>): Promise<Budget> {
    return requestJson<Budget>(
      `/api/budget/${month}`,
      {
        method: 'POST',
        body: JSON.stringify(budget),
      },
      'Failed to save budget'
    );
  },

  async getBudgetLifetimeStats(): Promise<BudgetLifetimeStats> {
    return requestJson<BudgetLifetimeStats>('/api/budget/lifetime/stats', {}, 'Failed to fetch lifetime budget stats');
  },

  async getMonthlyStats(): Promise<MonthlyStats> {
    return requestJson<MonthlyStats>('/api/budget/monthly/stats', {}, 'Failed to fetch monthly stats');
  },

  // Category endpoints
  async getCategories(): Promise<Category[]> {
    return requestJson<Category[]>('/api/categories', {}, 'Failed to fetch categories');
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    return requestJson<Category>(
      '/api/categories',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      'Failed to create category'
    );
  },

  async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
    return requestJson<Category>(
      `/api/categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      'Failed to update category'
    );
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/api/categories/${id}`, { method: 'DELETE' }, 'Failed to delete category');
  },

  // Goal endpoints
  async getGoals(): Promise<Goal[]> {
    return requestJson<Goal[]>('/api/goals', {}, 'Failed to fetch goals');
  },

  async createGoal(data: GoalCreate): Promise<Goal> {
    return requestJson<Goal>(
      '/api/goals',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      'Failed to create goal'
    );
  },

  async updateGoal(id: string, data: GoalUpdate): Promise<Goal> {
    return requestJson<Goal>(
      `/api/goals/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      'Failed to update goal'
    );
  },

  async deleteGoal(id: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/api/goals/${id}`, { method: 'DELETE' }, 'Failed to delete goal');
  },

  async reorderGoals(goalOrders: Array<{ id: string; order: number }>): Promise<{ message: string }> {
    return requestJson<{ message: string }>(
      '/api/goals/reorder',
      {
        method: 'PATCH',
        body: JSON.stringify(goalOrders),
      },
      'Failed to reorder goals'
    );
  },

  // Admin endpoints
  async clearTransactions(): Promise<{ message: string; deleted_count: number }> {
    return requestJson<{ message: string; deleted_count: number }>(
      '/api/admin/clear/transactions',
      { method: 'DELETE' },
      'Failed to clear transactions'
    );
  },

  async clearBudgets(): Promise<{ message: string; deleted_count: number }> {
    return requestJson<{ message: string; deleted_count: number }>(
      '/api/admin/clear/budgets',
      { method: 'DELETE' },
      'Failed to clear budgets'
    );
  },

  async clearAllData(): Promise<{ message: string; transactions_deleted: number; budgets_deleted: number; total_deleted: number }> {
    return requestJson<{ message: string; transactions_deleted: number; budgets_deleted: number; total_deleted: number }>(
      '/api/admin/clear/all',
      { method: 'DELETE' },
      'Failed to clear all data'
    );
  },
};
