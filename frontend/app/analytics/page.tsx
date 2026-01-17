'use client';

import { useEffect, useMemo, useState } from "react";
import { Facebook, Linkedin, Twitter, Youtube } from "lucide-react";
import { api, type Transaction } from "@/lib/api";

type TabKey = "analytics" | "expenses" | "income" | "incomeVsExpenses" | "balance" | "history";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "analytics", label: "Analytics" },
  { key: "expenses", label: "Expenses" },
  { key: "income", label: "Income" },
  { key: "incomeVsExpenses", label: "Income vs Expenses" },
  { key: "balance", label: "Balance" },
  { key: "history", label: "Transaction History" },
];

const kpis = [
  { label: "Daily Average", value: "$5470.36", accent: "bg-[#4E4EFF]" },
  { label: "Change", value: "+47.36%", accent: "bg-emerald-500" },
  { label: "Total Transaction", value: "354", accent: "bg-amber-500" },
  { label: "Categories", value: "40", accent: "bg-red-500" },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("analytics");
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const breadcrumbs = useMemo(() => {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Home</span>
        <span className="text-gray-300">›</span>
        <span className="text-gray-900 font-medium">Analytics</span>
      </div>
    );
  }, []);

  useEffect(() => {
    if (activeTab !== "history") return;
    let alive = true;

    setTxLoading(true);
    setTxError(null);

    api
      .getTransactions()
      .then((data) => {
        if (!alive) return;
        setTransactions(data);
      })
      .catch((err: any) => {
        if (!alive) return;
        setTxError(String(err?.detail || err?.message || "Failed to load transactions"));
        setTransactions([]);
      })
      .finally(() => {
        if (!alive) return;
        setTxLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeTab]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('da-DK').format(d);
  };

  const formatAmount = (amount: number) => {
    const sign = amount < 0 ? '-' : '';
    return `${sign}${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-8">
      {breadcrumbs}

      <div className="flex items-center gap-6 border-b border-gray-200">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-[#4E4EFF] border-[#4E4EFF]"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-full ${kpi.accent} flex items-center justify-center`}>
              <div className="w-4 h-4 rounded bg-white/90" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-lg font-semibold text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {activeTab !== "history" ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Expenses</h2>
            <div className="text-sm text-gray-500">{activeTab === "analytics" ? "Overview" : ""}</div>
          </div>

          <div className="h-80 rounded-lg bg-gradient-to-b from-gray-50 to-white border border-gray-100 flex items-end justify-between px-6 py-6">
            {Array.from({ length: 12 }).map((_, i) => {
              const base = 30 + ((i * 17) % 55);
              const a = Math.max(12, Math.min(90, base));
              const b = Math.max(8, Math.min(80, base - 12));
              const c = Math.max(6, Math.min(70, base - 22));
              return (
                <div key={i} className="w-6 flex flex-col justify-end gap-1">
                  <div className="w-full rounded-t bg-[#4E4EFF]" style={{ height: `${a}%`, opacity: 0.2 }} />
                  <div className="w-full rounded-t bg-[#4E4EFF]" style={{ height: `${b}%`, opacity: 0.35 }} />
                  <div className="w-full rounded-t bg-fuchsia-500" style={{ height: `${c}%`, opacity: 0.7 }} />
                  <div className="pt-2 text-[10px] text-gray-400 text-center">{i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-900">
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold text-right">Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txLoading ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500" colSpan={5}>
                      Loading transactions...
                    </td>
                  </tr>
                ) : txError ? (
                  <tr>
                    <td className="px-6 py-6 text-red-600" colSpan={5}>
                      {txError}
                    </td>
                  </tr>
                ) : (transactions ?? []).length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500" colSpan={5}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  (transactions ?? []).map((t) => {
                    const isExpense = t.type === 'expense';
                    const amountText = `${isExpense ? '-' : '+'}${formatAmount(t.amount)}`;
                    return (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isExpense ? 'bg-emerald-500' : 'bg-[#4E4EFF]'}`}>
                              <span className="text-white text-xs font-semibold">{t.category.slice(0, 1)}</span>
                            </div>
                            <span className="text-gray-700 font-medium">{t.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(t.date)}</td>
                        <td className="px-6 py-4 text-gray-500">{t.description || '-'}</td>
                        <td className="px-6 py-4 text-right text-gray-500">{amountText}</td>
                        <td className="px-6 py-4 text-right text-gray-500">USD</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="flex items-center justify-between pt-8 border-t border-gray-200 text-sm text-gray-500">
        <p>© Copyright 2026 PocketFlow | All Rights Reserved</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-700 transition-colors" aria-label="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors" aria-label="Twitter">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors" aria-label="LinkedIn">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors" aria-label="YouTube">
            <Youtube className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}
