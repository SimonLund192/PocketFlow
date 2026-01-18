"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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

  /**
   * Called after a successful confirmation so parent views can refresh data.
   */
  onConfirmed?: () => Promise<void> | void;
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

type ProposalStep = {
  id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
};

type PendingProposal = {
  planId: string;
  summary: string;
  steps: ProposalStep[];
};

function formatStepArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "";

  // Prefer a compact preview: show up to 3 important-looking keys.
  const picked = entries.slice(0, 3);
  const preview = picked
    .map(([k, v]) => {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      const clipped = s.length > 40 ? `${s.slice(0, 37)}...` : s;
      return `${k}: ${clipped}`;
    })
    .join(", ");

  return preview;
}

function ProposedChangesCard({
  proposal,
}: {
  proposal: PendingProposal;
}) {
  return (
    <div
      data-testid="ai-proposal"
      className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-900"
    >
      <div className="mb-1 text-xs font-semibold text-blue-900/80">
        Proposed changes
      </div>
      <div className="whitespace-pre-wrap">{proposal.summary}</div>

      {proposal.steps.length > 0 ? (
        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold text-blue-900/80">
            Planned steps
          </div>
          <ol className="space-y-2">
            {proposal.steps.map((s, idx) => (
              <li
                key={s.id}
                data-testid="ai-proposal-step"
                className="rounded-md border border-blue-200 bg-white px-3 py-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold text-gray-900">
                    {idx + 1}. {s.tool_name}
                  </div>
                </div>
                {Object.keys(s.arguments).length > 0 ? (
                  <div className="mt-1 text-xs text-gray-600">
                    {formatStepArgs(s.arguments)}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

export function AIAssistantPanel({
  initialMessages,
  isLoading: isLoadingProp = false,
  error = null,
  onSendMessage,
  onConfirmed,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>(
    initialMessages ?? []
  );
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const combinedError = error ?? localError;

  const isLoading = isLoadingProp || localLoading;

  const canSend = !isLoading && input.trim().length > 0;

  const emptyStateText = useMemo(() => {
    return "Ask me anything about your budget. I can propose changes before you confirm.";
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setLocalError(null);
    setSuccess(null);
  setPendingProposal(null);

    // Optimistic append of the user message.
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: "user", content: text },
    ]);
    setInput("");

    try {
      setLocalLoading(true);

      if (onSendMessage) {
        await onSendMessage(text);
        return;
      }

      const res = await api.aiChat({ text });

      // Keep a pending proposal with full details.
      setPendingProposal({
        planId: res.plan_id,
        summary: res.summary,
        steps: (res.plan?.steps ?? []) as ProposalStep[],
      });
    } catch (e: any) {
      setLocalError(e?.message ?? "Failed to send message");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => {
    setPendingProposal(null);
    setSuccess(null);
    setLocalError(null);
  };

  const handleConfirm = async () => {
    if (!pendingProposal?.planId || isLoading) return;
    setLocalError(null);
    setSuccess(null);

    try {
      setLocalLoading(true);
  await api.aiConfirm({ plan_id: pendingProposal.planId });
      setSuccess("Confirmed and applied.");
  setPendingProposal(null);
      await onConfirmed?.();
    } catch (e: any) {
      setLocalError(e?.message ?? "Failed to confirm proposal");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Card data-testid="ai-assistant-panel" className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">AI Assistant</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div
            data-testid="ai-success"
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            aria-live="polite"
          >
            {success}
          </div>
        ) : null}

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

          {pendingProposal ? <ProposedChangesCard proposal={pendingProposal} /> : null}

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

        {pendingProposal ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              data-testid="ai-cancel"
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              data-testid="ai-confirm"
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              Confirm
            </Button>
          </div>
        ) : null}

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
