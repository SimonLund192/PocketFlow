import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
		back: jest.fn(),
	}),
}));

jest.mock("@/contexts/AuthContext", () => ({
	useAuth: () => ({
		isAuthenticated: true,
		isLoading: false,
		user: { id: "u", email: "u@x.com", full_name: "User", created_at: new Date().toISOString() },
	}),
}));

import DashboardPage from "@/app/page";

jest.mock("@/lib/api", () => ({
  api: {
    getDashboardSummary: jest.fn().mockResolvedValue({
      total_balance: 0,
      monthly_income: 0,
      monthly_expenses: 0,
      net_income_monthly: 0,
    }),
		getDashboardStats: jest.fn().mockResolvedValue({
			income: 0,
			expenses: 0,
			savings: 0,
			net_income: 0,
		}),
    getBalanceTrends: jest.fn().mockResolvedValue([]),
    getExpenseBreakdown: jest.fn().mockResolvedValue([]),
		getBudgetExpenseBreakdown: jest.fn().mockResolvedValue([]),
		getBudgetLifetimeStats: jest.fn().mockResolvedValue({
			total_spent: 0,
			total_budgeted: 0,
			remaining: 0,
		}),
			getMonthlyStats: jest.fn().mockResolvedValue([]),
    getSavingsTrends: jest.fn().mockResolvedValue([]),
    getGoals: jest.fn().mockResolvedValue([]),
    getCategories: jest.fn().mockResolvedValue([]),
  },
}));

describe("smoke", () => {
	it("renders dashboard shell", async () => {
		render(<DashboardPage />);
		expect(await screen.findByText("Net Income (Monthly)")).toBeInTheDocument();
	});
});
