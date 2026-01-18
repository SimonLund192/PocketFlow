import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    aiChat: jest.fn(),
    aiConfirm: jest.fn(),
  },
}));

describe("AIAssistantPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders messages with clear separation", () => {
    render(
      <AIAssistantPanel
        initialMessages={[
          { id: "m1", type: "user", content: "Add rent 9000" },
          { id: "m2", type: "assistant", content: "Got it." },
          { id: "m3", type: "proposal", content: "I will create a rent transaction." },
        ]}
      />
    );

    expect(screen.getByTestId("ai-assistant-panel")).toBeInTheDocument();

    const userMsg = screen.getByTestId("ai-message-user");
    const assistantMsg = screen.getByTestId("ai-message-assistant");
    const proposalMsg = screen.getByTestId("ai-message-proposal");

    expect(userMsg).toHaveTextContent("You");
    expect(userMsg).toHaveTextContent("Add rent 9000");

    expect(assistantMsg).toHaveTextContent("Assistant");
    expect(assistantMsg).toHaveTextContent("Got it.");

    expect(proposalMsg).toHaveTextContent("Proposed changes");
    expect(proposalMsg).toHaveTextContent("I will create a rent transaction.");
  });

  it("shows loading state", () => {
    render(<AIAssistantPanel isLoading />);

    expect(screen.getByTestId("ai-loading")).toHaveTextContent("Thinking...");
    expect(screen.getByTestId("ai-input")).toBeDisabled();
    expect(screen.getByTestId("ai-send")).toBeDisabled();
  });

  it("shows error state", () => {
    render(<AIAssistantPanel error="Something went wrong" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
  });

  it("wires chat -> proposal and shows confirm/cancel", async () => {
    const mockedApi = api as unknown as {
      aiChat: jest.Mock;
      aiConfirm: jest.Mock;
    };

    mockedApi.aiChat.mockResolvedValue({
      status: "planned",
      plan_id: "plan-1",
      summary: "I will create a transaction.",
      plan: {
        steps: [
          {
            id: "s1",
            tool_name: "create_transaction",
            arguments: { amount: 9000, category: "Rent" },
          },
        ],
      },
    });

    render(<AIAssistantPanel />);

    fireEvent.change(screen.getByTestId("ai-input"), {
      target: { value: "Add rent 9000" },
    });

    fireEvent.click(screen.getByTestId("ai-send"));

    await waitFor(() => expect(mockedApi.aiChat).toHaveBeenCalledTimes(1));
    expect(mockedApi.aiChat).toHaveBeenCalledWith({ text: "Add rent 9000" });

    const proposal = await screen.findByTestId("ai-proposal");
    expect(proposal).toHaveTextContent("I will create a transaction.");
    const steps = screen.getAllByTestId("ai-proposal-step");
    expect(steps).toHaveLength(1);
    expect(steps[0]).toHaveTextContent("create_transaction");
    expect(steps[0]).toHaveTextContent("amount:");
    expect(screen.getByTestId("ai-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("ai-cancel")).toBeInTheDocument();
  });

  it("confirm calls api, shows success, and triggers refresh callback", async () => {
    const mockedApi = api as unknown as {
      aiChat: jest.Mock;
      aiConfirm: jest.Mock;
    };

    mockedApi.aiChat.mockResolvedValue({
      status: "planned",
      plan_id: "plan-2",
      summary: "I will update the budget.",
      plan: { steps: [{ id: "s1", tool_name: "create_budget_entry", arguments: { value: 10 } }] },
    });
    mockedApi.aiConfirm.mockResolvedValue({ status: "executed", results: [] });

    const onConfirmed = jest.fn();
    render(<AIAssistantPanel onConfirmed={onConfirmed} />);

    fireEvent.change(screen.getByTestId("ai-input"), {
      target: { value: "Update budget" },
    });
    fireEvent.click(screen.getByTestId("ai-send"));

    await screen.findByTestId("ai-confirm");
    fireEvent.click(screen.getByTestId("ai-confirm"));

    await waitFor(() => expect(mockedApi.aiConfirm).toHaveBeenCalledTimes(1));
    expect(mockedApi.aiConfirm).toHaveBeenCalledWith({ plan_id: "plan-2" });
    expect(await screen.findByTestId("ai-success")).toHaveTextContent(
      "Confirmed and applied."
    );
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
  });

  it("cancel clears pending proposal UI", async () => {
    const mockedApi = api as unknown as {
      aiChat: jest.Mock;
    };

    mockedApi.aiChat.mockResolvedValue({
      status: "planned",
      plan_id: "plan-3",
      summary: "I will do something.",
      plan: { steps: [{ id: "s1", tool_name: "noop", arguments: {} }] },
    });

    render(<AIAssistantPanel />);

    fireEvent.change(screen.getByTestId("ai-input"), {
      target: { value: "Something" },
    });
    fireEvent.click(screen.getByTestId("ai-send"));

    await screen.findByTestId("ai-cancel");
    fireEvent.click(screen.getByTestId("ai-cancel"));

    expect(screen.queryByTestId("ai-confirm")).toBeNull();
    expect(screen.queryByTestId("ai-proposal")).toBeNull();
  });

  it("shows error when chat fails", async () => {
    const mockedApi = api as unknown as {
      aiChat: jest.Mock;
    };

    mockedApi.aiChat.mockRejectedValue(new Error("boom"));

    render(<AIAssistantPanel />);

    fireEvent.change(screen.getByTestId("ai-input"), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByTestId("ai-send"));

    expect(await screen.findByTestId("ai-error")).toHaveTextContent("boom");
  });
});
