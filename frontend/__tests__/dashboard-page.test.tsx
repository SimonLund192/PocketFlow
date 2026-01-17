import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    getDashboardStats: jest.fn(),
    getBalanceTrends: jest.fn(),
    getSavingsTrends: jest.fn(),
    getBudgetExpenseBreakdown: jest.fn(),
    getBudgetLifetimeStats: jest.fn(),
    getMonthlyStats: jest.fn(),
    getGoals: jest.fn(),
  },
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

import DashboardPage from "@/app/page";

describe("DashboardPage", () => {
  it("renders KPI cards from mocked api", async () => {
    const mockedApi = api as unknown as {
      getDashboardStats: jest.Mock;
      getBalanceTrends: jest.Mock;
      getSavingsTrends: jest.Mock;
      getBudgetExpenseBreakdown: jest.Mock;
      getBudgetLifetimeStats: jest.Mock;
      getMonthlyStats: jest.Mock;
      getGoals: jest.Mock;
    };

    mockedApi.getDashboardStats.mockResolvedValue({
      net_income: 0,
      total_savings: 0,
      total_expenses: 0,
      goals_achieved: 0,
      period_change_percentage: 0,
      last_month_net_income: 0,
    });
    mockedApi.getBalanceTrends.mockResolvedValue([]);
    mockedApi.getSavingsTrends.mockResolvedValue([]);
    mockedApi.getBudgetExpenseBreakdown.mockResolvedValue([]);
    mockedApi.getBudgetLifetimeStats.mockResolvedValue({
      total_income: 0,
      total_shared_expenses: 0,
      total_personal_expenses: 0,
      total_shared_savings: 0,
      remaining: 0,
    });
    mockedApi.getMonthlyStats.mockResolvedValue({
      current_income: 1000,
      current_expenses: 400,
      current_savings: 200,
      previous_income: 900,
      previous_expenses: 300,
      previous_savings: 100,
    });
    mockedApi.getGoals.mockResolvedValue([{ id: "g1", user_id: "u", name: "Goal 1", saved: 0, target: 50, percentage: 0, color: "bg-blue-500", order: 0, created_at: new Date().toISOString() }]);

    render(<DashboardPage />);

    // Wait for main content to render (loading state removed)
    expect(await screen.findByText("Net Income (Monthly)")).toBeTruthy();
    expect(screen.getByText("Savings (Monthly)")).toBeTruthy();
    expect(screen.getByText("Expenses (Monthly)")).toBeTruthy();
    expect(screen.getByText("Goals Achieved")).toBeTruthy();

    await waitFor(() => {
      expect(mockedApi.getDashboardStats).toHaveBeenCalledTimes(1);
    });

    // Goals achieved should be computed to 0 (not enough savings)
    expect(screen.getByText("0")).toBeTruthy();
  });
});
