"use client";

import { useState, useRef, useEffect } from "react";
import {
  sendChatMessage,
  confirmBudgetEntries,
  uploadCSV,
  seedDemoData,
  ChatMessage,
  PendingAction,
  ProposedEntry,
} from "@/lib/ai-api";
import {
  X,
  Send,
  Upload,
  Check,
  XCircle,
  Loader2,
  PanelRightClose,
  Sparkles,
  Trash2,
  DatabaseZap,
} from "lucide-react";
import { useAISidebar } from "@/contexts/AISidebarContext";

export default function AISidebar() {
  const { isOpen, toggle, close } = useAISidebar();

  const defaultMessage =
    "Hi! I'm your PocketFlow AI assistant. I can help you with your budget, transactions, and financial insights. You can also upload a CSV bank statement and I'll categorize everything for you. What would you like to do?";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: defaultMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSeedDemo = async () => {
    if (isSeeding) return;
    setIsSeeding(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: "🎲 Load demo data" },
    ]);

    try {
      const result = await seedDemoData();
      const { summary } = result;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Demo data loaded!\n\n• ${summary.categories_created} categories created\n• ${summary.budgets_created} budgets created (3 months)\n• ${summary.line_items_created} budget line items added\n• ${summary.goals_created} goals created\n\nHead to the Budget or Dashboard page to see your data! 🎉`,
        },
      ]);
    } catch (_error) {
      console.error("Error seeding demo data:", _error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't load the demo data. Please try again or check if you're logged in.",
        },
      ]);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await sendChatMessage({
        messages: [...messages, userMessage],
      });
      setMessages((prev) => [...prev, response.message]);
      if (response.pending_action) {
        setPendingAction(response.pending_action);
      }
    } catch (_error) {
      console.error("Error sending message:", _error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction || isConfirming) return;
    setIsConfirming(true);

    try {
      const response = await confirmBudgetEntries(pendingAction.entries);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "✅ Confirmed" },
        response.message,
      ]);
      setPendingAction(null);
    } catch (_error) {
      console.error("Error confirming:", _error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error saving the entries. Please try again." },
      ]);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "❌ Cancelled" },
      {
        role: "assistant",
        content: "No problem, I've cancelled that. Let me know if you'd like to try again or make changes.",
      },
    ]);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📎 Uploaded: ${file.name}` },
    ]);
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await uploadCSV(file);
      setMessages((prev) => [...prev, response.message]);
      if (response.pending_action) {
        setPendingAction(response.pending_action);
      }
    } catch (_error) {
      console.error("Error uploading CSV:", _error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that CSV file. Make sure it's a valid CSV with transaction data.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([{ role: "assistant", content: defaultMessage }]);
    setPendingAction(null);
  };

  return (
    <>
      {/* Toggle button — always visible on the right edge */}
      <button
        onClick={toggle}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center transition-all duration-300 ease-in-out ${
          isOpen
            ? "right-[380px] w-8 h-16 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-l-xl shadow-lg"
            : "right-0 w-10 h-20 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-l-2xl shadow-xl"
        }`}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <PanelRightClose className="w-4 h-4 text-white" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-[9px] font-bold text-white/90 tracking-wide">AI</span>
          </div>
        )}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`h-full bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "w-[380px] min-w-[380px]" : "w-0 min-w-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="hover:bg-blue-800 rounded p-1.5 transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={close}
              className="hover:bg-blue-800 rounded p-1.5 transition-colors"
              aria-label="Close sidebar"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Demo data seed card — shown only on initial welcome */}
          {messages.length === 1 && messages[0].role === "assistant" && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DatabaseZap className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">New here?</p>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Load 3 months of realistic demo budget data so you can explore the app right away — income, expenses, savings, and goals for two people.
              </p>
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading demo data...
                  </>
                ) : (
                  <>
                    <DatabaseZap className="w-4 h-4" />
                    Load Demo Data
                  </>
                )}
              </button>
            </div>
          )}

          {/* Pending action confirmation card */}
          {pendingAction && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-xs font-semibold text-amber-800">Awaiting your confirmation</p>
              </div>
              <div className="text-sm text-amber-900 space-y-1">
                {pendingAction.entries.map((entry: ProposedEntry, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-amber-100 last:border-0"
                  >
                    <div>
                      <span className="font-medium text-xs">{entry.name}</span>
                      <span className="text-amber-700 ml-1 text-[10px]">
                        ({entry.category_name} · {entry.category_type})
                      </span>
                    </div>
                    <span className="font-semibold text-xs">
                      {entry.amount.toLocaleString("da-DK")} kr.
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {isConfirming ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  {isConfirming ? "Saving..." : "Confirm & Save"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isConfirming}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:hover:bg-transparent rounded-lg transition-colors shrink-0"
              aria-label="Upload CSV"
              title="Upload bank CSV"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
