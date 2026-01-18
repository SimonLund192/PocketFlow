import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    getDashboardStats: jest.fn(),
    getBalanceTrends: jest.fn(),
    getSavingsTrends: jest.fn(),
    getBudgetExpenseBreakdown: jest.fn(),
    getCategories: jest.fn(),
    getBudgetLifetimeStats: jest.fn(),
    getMonthlyStats: jest.fn(),
    getGoals: jest.fn(),
    aiChat: jest.fn(),
    aiConfirm: jest.fn(),
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
      getCategories: jest.Mock;
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
    mockedApi.getCategories.mockResolvedValue([]);
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

  it("refreshes dashboard data and shows badge after AI confirm", async () => {
    const mockedApi = api as unknown as {
      getDashboardStats: jest.Mock;
      getBalanceTrends: jest.Mock;
      getSavingsTrends: jest.Mock;
      getBudgetExpenseBreakdown: jest.Mock;
      getCategories: jest.Mock;
      getBudgetLifetimeStats: jest.Mock;
      getMonthlyStats: jest.Mock;
      getGoals: jest.Mock;
      aiChat: jest.Mock;
      aiConfirm: jest.Mock;
    };

    mockedApi.getDashboardStats
      .mockResolvedValueOnce({
        net_income: 0,
        total_savings: 0,
        total_expenses: 0,
        goals_achieved: 0,
        period_change_percentage: 0,
        last_month_net_income: 0,
      })
      .mockResolvedValueOnce({
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
    mockedApi.getCategories.mockResolvedValue([]);
    mockedApi.getBudgetLifetimeStats.mockResolvedValue({
      total_income: 0,
      total_shared_expenses: 0,
      total_personal_expenses: 0,
      total_shared_savings: 0,
      remaining: 0,
    });

    // First load monthlies -> initial KPI
    mockedApi.getMonthlyStats
      .mockResolvedValueOnce({
        current_income: 1000,
        current_expenses: 400,
        current_savings: 200,
        previous_income: 900,
        previous_expenses: 300,
        previous_savings: 100,
      })
      // Second load monthlies -> updated KPI (net income changes)
      .mockResolvedValueOnce({
        current_income: 1200,
        current_expenses: 200,
        current_savings: 300,
        previous_income: 1000,
        previous_expenses: 250,
        previous_savings: 200,
      });

    mockedApi.getGoals.mockResolvedValue([]);

    mockedApi.aiChat.mockResolvedValue({
      status: "planned",
      plan_id: "plan-x",
      summary: "I will do something.",
      plan: { steps: [{ id: "s1", tool_name: "noop", arguments: {} }] },
    });
    mockedApi.aiConfirm.mockResolvedValue({ status: "executed", results: [] });

    render(<DashboardPage />);

    // Initial KPI
  const netIncomeTitle = await screen.findByText("Net Income (Monthly)");
  const netIncomeCard = netIncomeTitle.closest("div")?.closest("div");
  expect(netIncomeCard).toBeTruthy();
  expect(netIncomeCard as HTMLElement).toHaveTextContent(/600\s*kr\./);

    // Chat + confirm
    fireEvent.change(screen.getByTestId("ai-input"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByTestId("ai-send"));
    await screen.findByTestId("ai-confirm");
    fireEvent.click(screen.getByTestId("ai-confirm"));

    await waitFor(() => expect(mockedApi.aiConfirm).toHaveBeenCalledTimes(1));

    // Should have re-fetched dashboard data after confirm.
    await waitFor(() => {
      expect(mockedApi.getMonthlyStats.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    // Updated KPI should render.
    expect(netIncomeCard as HTMLElement).toHaveTextContent(/1\.000\s*kr\./);

    // Subtle feedback
    expect(screen.getByTestId("ai-updated-badge")).toHaveTextContent(
      "Updated via AI Assistant"
    );
  });
});
