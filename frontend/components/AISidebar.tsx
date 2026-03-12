"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendChatMessage,
  uploadCSV,
  seedDemoData,
  ChatMessage,
} from "@/lib/ai-api";
import {
  X,
  Send,
  Upload,
  Loader2,
  PanelRightClose,
  Sparkles,
  Trash2,
  DatabaseZap,
} from "lucide-react";
import { useAISidebar } from "@/contexts/AISidebarContext";
import { useBudgetDrafts } from "@/contexts/BudgetDraftContext";
import { useMonth } from "@/contexts/MonthContext";
import { makeDraftRow } from "@/lib/budget-draft";

export default function AISidebar() {
  const router = useRouter();
  const { isOpen, toggle, close } = useAISidebar();
  const { mergeRows, hydrateMonth } = useBudgetDrafts();
  const { setSelectedMonth } = useMonth();

  const defaultMessage =
    "Hi! I'm your PocketFlow AI assistant. I can help you with your budget, transactions, and financial insights. You can also upload a CSV bank statement and I'll categorize everything for you. What would you like to do?";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: defaultMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const moveEntriesIntoDraft = (
    entries: Array<{
      name: string;
      category_id: string;
      amount: number;
      owner_slot: "user1" | "user2" | "shared";
      month: string;
      needs_review?: boolean;
    }>,
    originText: string,
  ) => {
    const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
      acc[entry.month] = acc[entry.month] || [];
      acc[entry.month].push(entry);
      return acc;
    }, {});

    const firstMonth = Object.keys(grouped)[0];
    Object.entries(grouped).forEach(([month, monthEntries]) => {
      mergeRows(
        month,
        monthEntries.map((entry) =>
          makeDraftRow({
            name: entry.name,
            category_id: entry.category_id,
            amount: entry.amount,
            owner_slot: entry.owner_slot,
            include: true,
            source: "ai",
            needs_review: entry.needs_review ?? true,
          }),
        ),
      );
      hydrateMonth(month, { initialized: true });
    });

    if (firstMonth) {
      setSelectedMonth(firstMonth);
      router.push("/budget");
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: originText,
      },
    ]);
  };

  const handleSeedDemo = async () => {
    if (isSeeding) return;
    setIsSeeding(true);

    setMessages((prev) => [...prev, { role: "user", content: "🎲 Load demo data" }]);

    try {
      const result = await seedDemoData();
      const { summary } = result;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Demo data loaded!\n\n• ${summary.categories_created} categories created\n• ${summary.budgets_created} budgets created (3 months)\n• ${summary.line_items_created} budget line items added\n• ${summary.goals_created} goals created\n\nHead to the Budget or Dashboard page to see your data!`,
        },
      ]);
    } catch (error) {
      console.error("Error seeding demo data:", error);
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

    try {
      const response = await sendChatMessage({
        messages: [...messages, userMessage],
      });

      setMessages((prev) => [...prev, response.message]);

      if (response.pending_action?.entries?.length) {
        moveEntriesIntoDraft(
          response.pending_action.entries,
          `I moved ${response.pending_action.entries.length} draft entr${response.pending_action.entries.length === 1 ? "y" : "ies"} into your budget review table. You can edit everything before saving.`,
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setMessages((prev) => [...prev, { role: "user", content: `📎 Uploaded: ${file.name}` }]);
    setIsLoading(true);

    try {
      const response = await uploadCSV(file);
      setMessages((prev) => [...prev, response.message]);

      if (response.pending_action?.entries?.length) {
        moveEntriesIntoDraft(
          response.pending_action.entries,
          "I moved the uploaded rows into your budget review table so you can adjust them before saving.",
        );
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
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

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([{ role: "assistant", content: defaultMessage }]);
  };

  return (
    <>
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

      <aside
        className={`h-full bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "w-[380px] min-w-[380px]" : "w-0 min-w-0"
        }`}
      >
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {messages.length === 1 && messages[0].role === "assistant" && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DatabaseZap className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">New here?</p>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Load 3 months of realistic demo budget data so you can explore the app right away.
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

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

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
