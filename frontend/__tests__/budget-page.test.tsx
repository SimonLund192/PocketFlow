import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

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
    user: { id: "u", email: "u@x.com", full_name: "User 1", created_at: new Date().toISOString() },
  }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    getCategories: jest.fn(),
    getBudget: jest.fn(),
    saveBudget: jest.fn(),
  },
}));

import { api } from "@/lib/api";
import BudgetPage from "@/app/budget/page";

describe("Budget page", () => {
  it("loads budget for selected month via api", async () => {
    const mockedApi = api as unknown as {
      getCategories: jest.Mock;
      getBudget: jest.Mock;
      saveBudget: jest.Mock;
    };

    mockedApi.getCategories.mockResolvedValue([]);
    mockedApi.getBudget.mockResolvedValue({
      user_id: "user-a",
      month: "2026-01",
      income_user1: [],
      income_user2: [],
      shared_expenses: [],
      personal_user1: [],
      personal_user2: [],
      shared_savings: [],
      personal_savings_user1: [],
      personal_savings_user2: [],
    });
    mockedApi.saveBudget.mockResolvedValue({ message: "ok" });

    render(<BudgetPage />);

    await waitFor(() => {
      expect(mockedApi.getBudget).toHaveBeenCalled();
    });

    // Basic smoke assertion that page sections rendered
    expect(screen.getByText("Budget")).toBeTruthy();
  });
});
