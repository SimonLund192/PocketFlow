import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DevUserSwitcher } from "@/components/DevUserSwitcher";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    api: {
      ...actual.api,
      listUsers: jest.fn(),
    },
  };
});

const mockedApi = api as unknown as { listUsers: jest.Mock };

describe("DevUserSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedApi.listUsers.mockReset();
  });

  it("stores selected user id in localStorage", async () => {
    mockedApi.listUsers.mockResolvedValue([
      { id: "u1", email: "u1@example.com", full_name: "User One", created_at: "2026-01-01" },
      { id: "u2", email: "u2@example.com", full_name: "User Two", created_at: "2026-01-01" },
    ]);

    render(<DevUserSwitcher />);

    const select = await screen.findByTestId("dev-user-switcher");

    await waitFor(() => {
      expect(mockedApi.listUsers).toHaveBeenCalledTimes(1);
    });

    await userEvent.selectOptions(select, "u2");
    expect(localStorage.getItem("selected_user_id")).toBe("u2");
  });
});
