import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false, user: null }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    getDashboardStats: jest.fn(),
    getBalanceTrends: jest.fn(),
    getSavingsTrends: jest.fn(),
    getBudgetExpenseBreakdown: jest.fn(),
    getBudgetLifetimeStats: jest.fn(),
    getMonthlyStats: jest.fn(),
    getGoals: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

import HomePage from "../app/page";

test("home page renders with mocked api", () => {
  render(<HomePage />);
  // Non-authenticated path should render an empty-state dashboard without crashing.
  expect(document.body.textContent?.length).toBeGreaterThan(0);
  // A generic assertion to ensure React rendered something.
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
