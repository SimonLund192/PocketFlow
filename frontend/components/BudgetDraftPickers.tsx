"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search, User, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Category } from "@/lib/categories-api";
import { BudgetOwnerSlot } from "@/lib/budget-draft";
import { getIconComponent, getColorClass, isEmojiIcon, isHexColor } from "@/lib/category-utils";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | Category["type"];

const CATEGORY_FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "savings", label: "Savings" },
  { value: "fun", label: "Fun" },
];

const CATEGORY_TYPE_LABELS: Record<Category["type"], string> = {
  income: "Income",
  expense: "Expense",
  savings: "Savings",
  fun: "Fun",
};

interface CategoryPickerButtonProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  recentCategoryIds?: string[];
  preferredType?: CategoryFilter;
  placeholder?: string;
  title?: string;
  description?: string;
  allowClear?: boolean;
  className?: string;
  disabled?: boolean;
}

function CategoryPill({
  category,
  selected,
  onClick,
}: {
  category: Category;
  selected: boolean;
  onClick: () => void;
}) {
  const isEmoji = isEmojiIcon(category.icon);
  const Icon = isEmoji ? null : getIconComponent(category.icon);
  const useHex = isHexColor(category.color);
  const swatchClass = useHex ? "" : getColorClass(category.color);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
        selected
          ? "border-indigo-300 bg-indigo-50 text-indigo-950 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
      )}
    >
      <div
        className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base", swatchClass)}
        style={useHex ? { backgroundColor: `${category.color}20` } : undefined}
      >
        {isEmoji ? (
          <span>{category.icon}</span>
        ) : Icon ? (
          <Icon className="h-5 w-5 text-gray-700" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{category.name}</p>
        <p className="text-xs text-gray-500">{CATEGORY_TYPE_LABELS[category.type]}</p>
      </div>
      {selected && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
    </button>
  );
}

export function CategoryPickerButton({
  categories,
  value,
  onChange,
  recentCategoryIds = [],
  preferredType = "all",
  placeholder = "Choose category",
  title = "Choose a category",
  description = "Search, use a recent category, or browse by type.",
  allowClear = true,
  className,
  disabled = false,
}: CategoryPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>(preferredType);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveFilter(preferredType);
  }, [open, preferredType]);

  const selected = categories.find((category) => category.id === value);

  const filteredCategories = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return categories.filter((category) => {
      if (activeFilter !== "all" && category.type !== activeFilter) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        category.name.toLowerCase().includes(searchTerm) ||
        CATEGORY_TYPE_LABELS[category.type].toLowerCase().includes(searchTerm)
      );
    });
  }, [activeFilter, categories, query]);

  const recentCategories = useMemo(() => {
    const rank = new Map(recentCategoryIds.map((id, index) => [id, index]));
    return categories
      .filter((category) => recentCategoryIds.includes(category.id))
      .sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99))
      .slice(0, 6);
  }, [categories, recentCategoryIds]);

  const groupedCategories = useMemo(() => {
    return filteredCategories.reduce<Record<Category["type"], Category[]>>(
      (acc, category) => {
        acc[category.type].push(category);
        return acc;
      },
      { income: [], expense: [], savings: [], fun: [] },
    );
  }, [filteredCategories]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:border-gray-200 disabled:hover:bg-gray-100",
          !selected && "text-gray-500",
          className,
        )}
      >
        {selected ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{selected.name}</p>
            <p className="truncate text-xs text-gray-500">{CATEGORY_TYPE_LABELS[selected.type]}</p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700">{placeholder}</p>
            <p className="text-xs text-amber-600">Missing category</p>
          </div>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden border-none bg-white p-0 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <DialogTitle className="text-xl text-gray-950">{title}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">{description}</DialogDescription>
          </DialogHeader>

          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search categories"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      activeFilter === filter.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>{filteredCategories.length} categories available</span>
              {selected && <span>Current: {selected.name}</span>}
              {!selected && <span>This row still needs a category</span>}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            {allowClear && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-left transition-colors hover:border-amber-400 hover:bg-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-900">Leave category empty for now</p>
                    <p className="text-xs text-amber-700">Keep the row flagged as needs review.</p>
                  </div>
                  {!value && <Check className="h-4 w-4 text-amber-700" />}
                </button>
              </div>
            )}

            {!query && recentCategories.length > 0 && (
              <section className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Recent picks</h3>
                  <p className="text-xs text-gray-500">Good for repeating imported entries</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recentCategories.map((category) => (
                    <CategoryPill
                      key={`recent-${category.id}`}
                      category={category}
                      selected={category.id === value}
                      onClick={() => {
                        onChange(category.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                <p className="text-sm font-medium text-gray-700">No categories match that search.</p>
                <p className="mt-1 text-xs text-gray-500">Try a broader search or switch category type.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(Object.keys(groupedCategories) as Array<Category["type"]>).map((type) => {
                  const group = groupedCategories[type];
                  if (group.length === 0) return null;

                  return (
                    <section key={type}>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{CATEGORY_TYPE_LABELS[type]}</h3>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                          {group.length}
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.map((category) => (
                          <CategoryPill
                            key={category.id}
                            category={category}
                            selected={category.id === value}
                            onClick={() => {
                              onChange(category.id);
                              setOpen(false);
                            }}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OwnerSegmentedControlProps {
  value: BudgetOwnerSlot | "";
  onChange: (value: BudgetOwnerSlot) => void;
  user1Name: string;
  user2Name: string;
  className?: string;
  disabled?: boolean;
}

export function OwnerSegmentedControl({
  value,
  onChange,
  user1Name,
  user2Name,
  className,
  disabled = false,
}: OwnerSegmentedControlProps) {
  const options: Array<{
    value: BudgetOwnerSlot;
    label: string;
    icon: typeof User;
  }> = [
    { value: "user1", label: user1Name, icon: User },
    { value: "user2", label: user2Name, icon: User },
    { value: "shared", label: "Shared", icon: Users },
  ];

  return (
    <div className={cn("inline-flex w-full rounded-xl bg-gray-100 p-1", disabled && "opacity-60", className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
              selected
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
