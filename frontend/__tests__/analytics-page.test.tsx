import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: "u", email: "u@x.com", full_name: "User", created_at: new Date().toISOString() },
  }),
}));

import AnalyticsPage from "@/app/analytics/page";

describe("Analytics page", () => {
  it("renders tabs and KPI cards when authenticated", () => {
    render(<AnalyticsPage />);

    // Tabs
    expect(screen.getAllByText("Analytics")[0]).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Income vs Expenses")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Transaction History")).toBeInTheDocument();

    // KPI cards
    expect(screen.getByText("Daily Average")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();

    // Chart section
    expect(screen.getByText("Weekly Expenses")).toBeInTheDocument();
  });
});
