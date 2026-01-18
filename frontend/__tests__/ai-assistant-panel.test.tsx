import React from "react";
import { render, screen } from "@testing-library/react";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";

describe("AIAssistantPanel", () => {
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
});
