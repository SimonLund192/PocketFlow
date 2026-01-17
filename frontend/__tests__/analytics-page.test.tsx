import React from "react";
import { render, screen } from "@testing-library/react";

import AnalyticsPage from "@/app/analytics/page";

describe("Analytics page", () => {
  it("renders key sections", () => {
    render(<AnalyticsPage />);

    expect(screen.getByText("Weekly Expenses")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expenses" })).toBeInTheDocument();
  });
});
