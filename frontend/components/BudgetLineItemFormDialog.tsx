"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Category } from "@/lib/categories-api";
import { Loader2, ChevronDown, Check } from "lucide-react";

export interface BudgetLineItemFormValues {
  name: string;
  category: string;
  amount: number;
}

interface BudgetLineItemFormCardProps {
  /** Categories available for selection */
  categories: Category[];
  /** Called with the form values on submit */
  onSubmit: (values: BudgetLineItemFormValues) => void;
  /** Title override */
  title?: string;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Error message */
  error?: string | null;
}

/** Custom category dropdown with icons and color badges */
function CategoryDropdown({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 w-full h-10 px-3 py-2 rounded-lg border text-sm transition-all ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white"
            : value
              ? "border-gray-200 bg-white hover:border-gray-300"
              : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        {selected ? (
          <>
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{ backgroundColor: selected.color + "22" }}
            >
              {selected.icon}
            </span>
            <span className="flex-1 text-left text-gray-900 truncate">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-400">
            Select a category
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-60 overflow-auto">
          {categories.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              No categories available
            </div>
          ) : (
            categories.map((cat) => {
              const isSelected = cat.id === value;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: cat.color + "22" }}
                  >
                    {cat.icon}
                  </span>
                  <span className="flex-1 text-left font-medium truncate">
                    {cat.name}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline card form for adding a budget item — mirrors the "Create a new category"
 * card on the Account page (left-side form pattern).
 */
export default function BudgetLineItemFormCard({
  categories,
  onSubmit,
  title = "Add a new item",
  isSubmitting = false,
  error: externalError,
}: BudgetLineItemFormCardProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  // Sync external error
  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    onSubmit({
      name: name.trim(),
      category,
      amount: Number(amount),
    });

    // Reset form after submit
    setName("");
    setCategory("");
    setAmount("");
    setError(null);
  };

  return (
    <Card className="p-8 bg-white border border-gray-200 rounded-2xl h-fit">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="bli-name">Name</Label>
            <Input
              id="bli-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent, Groceries"
            />
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="bli-category">Category</Label>
            <CategoryDropdown
              categories={categories}
              value={category}
              onChange={setCategory}
            />
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="bli-amount">Amount</Label>
            <div className="relative">
              <Input
                id="bli-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                placeholder="0.00"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                kr.
              </span>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add new item"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
