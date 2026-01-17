import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AnalyticsPage from "@/app/analytics/page";

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    api: {
      ...actual.api,
      getTransactions: jest.fn(),
    },
  };
});

import { api } from "@/lib/api";
const mockedApi = api as unknown as { getTransactions: jest.Mock };

describe("Analytics page", () => {
  it("renders key sections", () => {
    render(<AnalyticsPage />);

    expect(screen.getByText("Weekly Expenses")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expenses" })).toBeInTheDocument();
  });

  it("fetches transactions when opening Transaction History tab", async () => {
    mockedApi.getTransactions.mockResolvedValue([]);

    render(<AnalyticsPage />);

    await userEvent.click(screen.getByRole("button", { name: "Transaction History" }));
    expect(mockedApi.getTransactions).toHaveBeenCalledTimes(1);
  });
});
