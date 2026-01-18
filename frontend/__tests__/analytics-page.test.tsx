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
  it("renders heading", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });
});
