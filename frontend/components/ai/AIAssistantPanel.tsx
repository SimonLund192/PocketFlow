"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type AIAssistantMessageType = "user" | "assistant" | "proposal";

export interface AIAssistantMessage {
  id: string;
  type: AIAssistantMessageType;
  content: string;
}

export interface AIAssistantPanelProps {
  /**
   * Optional initial messages (useful for tests and future wiring).
   */
  initialMessages?: AIAssistantMessage[];

  /**
   * When true, disables input and shows a loading indicator.
   */
  isLoading?: boolean;

  /**
   * Optional error message to render.
   */
  error?: string | null;

  /**
   * Called when the user submits a message.
   * If it throws, the panel will show a local error.
   */
  onSendMessage?: (text: string) => Promise<void> | void;
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function MessageBubble({ message }: { message: AIAssistantMessage }) {
  const isUser = message.type === "user";
  const isAssistant = message.type === "assistant";
  const isProposal = message.type === "proposal";

  const label = isUser
    ? "You"
    : isProposal
      ? "Proposed changes"
      : "Assistant";

  return (
    <div
      data-testid={`ai-message-${message.type}`}
      className={cn(
        "rounded-lg border p-3 text-sm",
        isUser && "ml-auto max-w-[85%] bg-gray-900 text-white border-gray-900",
        isAssistant &&
          "mr-auto max-w-[85%] bg-white text-gray-900 border-gray-200",
        isProposal &&
          "mr-auto max-w-[95%] border-blue-200 bg-blue-50 text-gray-900"
      )}
    >
      <div className="mb-1 text-xs font-semibold opacity-80">{label}</div>
      <div className={cn("whitespace-pre-wrap", isUser && "text-white")}
      >
        {message.content}
      </div>
    </div>
  );
}

export function AIAssistantPanel({
  initialMessages,
  isLoading = false,
  error = null,
  onSendMessage,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>(
    initialMessages ?? []
  );
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const combinedError = error ?? localError;

  const canSend = !isLoading && input.trim().length > 0;

  const emptyStateText = useMemo(() => {
    return "Ask me anything about your budget. I can propose changes before you confirm.";
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setLocalError(null);

    // Optimistic append of the user message.
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: "user", content: text },
    ]);
    setInput("");

    try {
      await onSendMessage?.(text);
    } catch (e: any) {
      setLocalError(e?.message ?? "Failed to send message");
    }
  };

  return (
    <Card data-testid="ai-assistant-panel" className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">AI Assistant</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {combinedError ? (
          <div
            role="alert"
            data-testid="ai-error"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {combinedError}
          </div>
        ) : null}

        <div
          data-testid="ai-message-list"
          className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          {messages.length === 0 ? (
            <div className="text-sm text-gray-500">{emptyStateText}</div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {isLoading ? (
            <div
              data-testid="ai-loading"
              className="text-sm text-gray-500"
              aria-live="polite"
            >
              Thinking...
            </div>
          ) : null}
        </div>

        <div className="flex items-end gap-3">
          <label className="w-full">
            <span className="sr-only">Message</span>
            <textarea
              data-testid="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="min-h-[44px] w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              disabled={isLoading}
            />
          </label>
          <Button
            data-testid="ai-send"
            type="button"
            onClick={handleSend}
            disabled={!canSend}
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
