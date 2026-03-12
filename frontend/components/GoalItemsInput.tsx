"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface GoalItem {
  url?: string;
  name: string;
  amount: number;
}

interface GoalItemsInputProps {
  items: GoalItem[];
  onChange: (items: GoalItem[]) => void;
}

function emptyGoalItem(): GoalItem {
  return { url: "", name: "", amount: 0 };
}

export function normalizeGoalAmount(raw: string): number | null {
  const compact = raw.trim().replace(/\s+/g, "");
  if (!compact) return null;

  let normalized = compact;
  const dotMatches = compact.match(/\./g)?.length || 0;

  if (compact.includes(",") && compact.includes(".")) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  } else if (compact.includes(",")) {
    normalized = compact.replace(",", ".");
  } else if (dotMatches > 1) {
    normalized = compact.replace(/\./g, "");
  } else {
    const [whole, fraction] = compact.split(".");
    if (fraction && fraction.length === 3) {
      normalized = `${whole}${fraction}`;
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isBlankGoalItem(item: GoalItem) {
  return !item.name.trim() && !item.url?.trim() && (!item.amount || item.amount <= 0);
}

export function sanitizeGoalItems(items: GoalItem[]): GoalItem[] {
  return items
    .map((item) => ({
      name: item.name.trim(),
      amount: Number.isFinite(item.amount) ? item.amount : 0,
      url: item.url?.trim() || "",
    }))
    .filter((item) => !isBlankGoalItem(item));
}

export function isGoalItemComplete(item: GoalItem) {
  return item.name.trim().length > 0 && Number.isFinite(item.amount) && item.amount > 0;
}

export function calculateGoalItemsTotal(items: GoalItem[]) {
  return sanitizeGoalItems(items).reduce((sum, item) => sum + item.amount, 0);
}

function parseQuickAddLines(input: string): GoalItem[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const withoutPrefix = line.replace(/^\s*(?:[-*•]+|\d+[.)])\s*/, "");
      const urlMatch = withoutPrefix.match(/https?:\/\/\S+/i);
      const url = urlMatch?.[0] || "";
      const withoutUrl = url ? withoutPrefix.replace(url, "").trim() : withoutPrefix;
      const amountMatch = withoutUrl.match(/(-?\d[\d.,]*)$/);
      const amount = amountMatch ? normalizeGoalAmount(amountMatch[1]) || 0 : 0;
      const name = amountMatch
        ? withoutUrl.slice(0, amountMatch.index).trim()
        : withoutUrl.trim();

      return {
        name,
        amount,
        url,
      };
    })
    .filter((item) => item.name || item.amount > 0 || item.url);
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("da-DK", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} kr`;
}

export default function GoalItemsInput({ items, onChange }: GoalItemsInputProps) {
  const [quickAddInput, setQuickAddInput] = useState("");

  const reviewCount = useMemo(
    () => items.filter((item) => !isBlankGoalItem(item) && !isGoalItemComplete(item)).length,
    [items],
  );

  const totalAmount = useMemo(() => calculateGoalItemsTotal(items), [items]);

  const addItem = () => {
    onChange([...items, emptyGoalItem()]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (index: number, field: keyof GoalItem, value: string | number) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleQuickAdd = () => {
    const parsed = parseQuickAddLines(quickAddInput);
    if (parsed.length === 0) return;
    onChange([...items, ...parsed]);
    setQuickAddInput("");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Quick add steps
            </div>
            <p className="text-sm text-slate-600">
              Paste one step per line and we will split it into structured goal items for you.
            </p>
          </div>
          <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            Example: Flight tickets 4.500
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <Textarea
            value={quickAddInput}
            onChange={(event) => setQuickAddInput(event.target.value)}
            placeholder={"Plane tickets 4500\nHotel 6200\nMuseum pass 800 https://example.com"}
            className="min-h-[132px] rounded-2xl border-white bg-white/90 text-sm shadow-sm"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Put the amount at the end of the line. Links are picked up automatically if included.
            </p>
            <Button type="button" onClick={handleQuickAdd} disabled={!quickAddInput.trim()}>
              <ClipboardList className="h-4 w-4" />
              Add parsed steps
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-sm font-semibold text-slate-900">Goal steps</Label>
            <p className="mt-1 text-sm text-slate-500">
              Keep one row per item you want this goal to cover.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Add step manually
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No goal steps yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add a total above, or break the goal into steps here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const hasContent = !isBlankGoalItem(item);
              const incomplete = hasContent && !isGoalItemComplete(item);

              return (
                <div
                  key={`${index}-${item.name}-${item.amount}`}
                  className={cn(
                    "rounded-3xl border bg-slate-50 p-4 transition-colors",
                    incomplete ? "border-amber-300 bg-amber-50/70" : "border-slate-200",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Step {index + 1}
                      </p>
                      {incomplete && (
                        <p className="mt-1 text-xs text-amber-700">
                          Add a name and amount before saving.
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px]">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`item-name-${index}`} className="text-xs text-slate-500">
                        Name
                      </Label>
                      <Input
                        id={`item-name-${index}`}
                        value={item.name}
                        onChange={(event) => updateItem(index, "name", event.target.value)}
                        placeholder="Flight tickets"
                        className="rounded-2xl border-white bg-white"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor={`item-amount-${index}`} className="text-xs text-slate-500">
                        Amount
                      </Label>
                      <Input
                        id={`item-amount-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount || ""}
                        onChange={(event) =>
                          updateItem(index, "amount", Number(event.target.value) || 0)
                        }
                        placeholder="0"
                        className="rounded-2xl border-white bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1.5">
                    <Label htmlFor={`item-url-${index}`} className="text-xs text-slate-500">
                      Link (optional)
                    </Label>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id={`item-url-${index}`}
                        type="url"
                        value={item.url || ""}
                        onChange={(event) => updateItem(index, "url", event.target.value)}
                        placeholder="https://example.com"
                        className="rounded-2xl border-white bg-white pl-9"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-3xl border border-indigo-700 bg-indigo-600 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Step total
            </p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-sm text-white/80">
            {reviewCount > 0
              ? `${reviewCount} ${reviewCount === 1 ? "step needs" : "steps need"} review`
              : "Everything looks ready to save"}
          </div>
        </div>
      </div>
    </div>
  );
}
