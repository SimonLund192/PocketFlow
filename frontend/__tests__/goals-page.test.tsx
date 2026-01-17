import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import GoalsPage from "../app/goals/page";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({
  api: {
    getGoals: jest.fn(),
    getBudgetLifetimeStats: jest.fn(),
    updateGoal: jest.fn(),
  },
}));

const mockedApi = api as unknown as {
  getGoals: jest.Mock;
  getBudgetLifetimeStats: jest.Mock;
  updateGoal: jest.Mock;
};

describe("Goals page", () => {
  beforeEach(() => {
    mockedApi.getGoals.mockResolvedValue([
      {
        id: "goal-1",
        user_id: "user-a",
        name: "Trip",
        saved: 0,
        target: 1000,
        percentage: 0,
        color: "bg-green-500",
        order: 0,
        created_at: new Date().toISOString(),
      },
    ]);
    mockedApi.getBudgetLifetimeStats.mockResolvedValue({
      total_income: 0,
      total_shared_expenses: 0,
      total_personal_expenses: 0,
      total_shared_savings: 0,
      remaining: 0,
    });
  });

  it("loads goals via api and updates goal with mocks", async () => {
    mockedApi.updateGoal.mockResolvedValue({
      id: "goal-1",
      user_id: "user-a",
      name: "Trip Updated",
      saved: 0,
      target: 2000,
      percentage: 0,
      color: "bg-green-500",
      order: 0,
      created_at: new Date().toISOString(),
    });

    render(<GoalsPage />);

    // initial load
    // "Trip" appears both in the left list card and in the right-hand detail panel,
    // so assert we have at least one matching node.
    expect((await screen.findAllByText("Trip")).length).toBeGreaterThan(0);
    expect(mockedApi.getGoals).toHaveBeenCalledTimes(1);

    // open edit modal
    const editButtons = await screen.findAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);

    const nameInput = await screen.findByLabelText(/goal name/i);
    fireEvent.change(nameInput, { target: { value: "Trip Updated" } });

    const targetInput = await screen.findByLabelText(/target amount/i);
    fireEvent.change(targetInput, { target: { value: "2000" } });

    fireEvent.click(screen.getByRole("button", { name: /update goal/i }));

    await waitFor(() => {
      expect(mockedApi.updateGoal).toHaveBeenCalledWith("goal-1", {
        name: "Trip Updated",
        target: 2000,
      });
    });

    expect((await screen.findAllByText("Trip Updated")).length).toBeGreaterThan(0);
  });
});
