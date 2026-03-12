"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Copy, Plus, Save, TrendingDown, TrendingUp, Wand2, X } from "lucide-react";
import Header from "@/components/Header";
import QuickCategoryDialog from "@/components/QuickCategoryDialog";
import { CategoryPickerButton, OwnerSegmentedControl } from "@/components/BudgetDraftPickers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/auth-api";
import { categoriesApi, Category } from "@/lib/categories-api";
import { useMonth } from "@/contexts/MonthContext";
import { useBudgetDrafts } from "@/contexts/BudgetDraftContext";
import { BudgetDraftRow, BudgetTabType, makeDraftRow, rowMatchesTab } from "@/lib/budget-draft";
import { getBudgetByMonth, initializeBudgetMonth } from "@/lib/budgets-api";
import { getBudgetLineItemsByBudget, saveBudgetDraft } from "@/lib/budget-line-items-api";

type OwnerSlot = "user1" | "user2" | "shared";

const tabs: { id: BudgetTabType; label: string }[] = [
  { id: "all", label: "All Items" },
  { id: "income", label: "Income" },
  { id: "shared-expenses", label: "Shared Expenses" },
  { id: "personal-expenses", label: "Personal Expenses" },
  { id: "shared-savings", label: "Savings" },
  { id: "fun", label: "Fun" },
];

function StatCard({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card className="p-5 bg-white">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{title}</p>
      <div className="mt-3 flex items-center gap-2">
        {tone === "positive" && <TrendingUp className="w-4 h-4 text-green-500" />}
        {tone === "negative" && <TrendingDown className="w-4 h-4 text-red-500" />}
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("da-DK")} kr.`;
}

function normalizeAmount(raw: string): number | "" {
  if (!raw.trim()) return "";
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : "";
}

function computeNeedsReview(row: BudgetDraftRow) {
  return !row.name.trim() || !row.category_id || !row.amount || Number(row.amount) <= 0;
}

function findCategoryByName(categories: Category[], text: string) {
  const normalized = text.trim().toLowerCase();
  return categories.find((category) => category.name.trim().toLowerCase() === normalized);
}

function getDefaultOwnerFromTab(tab: BudgetTabType): OwnerSlot {
  if (tab === "shared-expenses" || tab === "shared-savings") return "shared";
  return "user1";
}

function getPreferredCategoryFilter(tab: BudgetTabType): "all" | Category["type"] {
  if (tab === "income") return "income";
  if (tab === "shared-expenses" || tab === "personal-expenses") return "expense";
  if (tab === "shared-savings") return "savings";
  if (tab === "fun") return "fun";
  return "all";
}

function sourceLabel(source: BudgetDraftRow["source"]) {
  if (source === "ai") return "AI";
  if (source === "import") return "Import";
  if (source === "copied") return "Copied";
  if (source === "existing") return "Saved";
  return "Manual";
}

function parseQuickAddLines(
  input: string,
  activeTab: BudgetTabType,
  categories: Category[],
): BudgetDraftRow[] {
  const owner = getDefaultOwnerFromTab(activeTab);

  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)(-?\d[\d.,]*)$/);
      const namePart = match?.[1]?.trim() || line;
      const amountPart = match?.[2]?.trim() || "";
      const matchedCategory = findCategoryByName(categories, namePart);
      const amount = amountPart ? normalizeAmount(amountPart) : "";

      return makeDraftRow({
        name: namePart,
        amount,
        category_id: matchedCategory?.id || "",
        category: matchedCategory,
        owner_slot: owner,
        include: true,
        source: "manual",
        needs_review: !matchedCategory || !amount,
      });
    });
}

export default function BudgetPage() {
  const { selectedMonth } = useMonth();
  const { drafts, getDraftState, hydrateMonth, addRow, updateRow, removeRow } = useBudgetDrafts();

  const [activeTab, setActiveTab] = useState<BudgetTabType>("all");
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState("");
  const [user1Name, setUser1Name] = useState("You");
  const [user2Name, setUser2Name] = useState("Partner");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkOwner, setBulkOwner] = useState<OwnerSlot | "">("");

  const loadedMonthsRef = useRef<Set<string>>(new Set());

  const draftState = drafts[selectedMonth] || getDraftState(selectedMonth);
  const rows = useMemo(
    () =>
      draftState.rows.map((row) => ({
        ...row,
        category: categories.find((category) => category.id === row.category_id) || row.category,
      })),
    [categories, draftState.rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!rowMatchesTab(row, activeTab)) return false;
      if (onlyNeedsReview && !row.needs_review) return false;
      return true;
    });
  }, [activeTab, onlyNeedsReview, rows]);

  const filteredIds = useMemo(() => filteredRows.map((row) => row.client_id), [filteredRows]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const totals = useMemo(() => {
    const included = rows.filter((row) => row.include && row.amount !== "" && !row.needs_review);
    const totalIncome = included
      .filter((row) => row.category?.type === "income")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const sharedExpenses = included
      .filter((row) => row.category?.type === "expense" && row.owner_slot === "shared")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const personalExpenses = included
      .filter((row) => row.category?.type === "expense" && row.owner_slot !== "shared")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const sharedSavings = included
      .filter((row) => row.category?.type === "savings")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const funSpending = included
      .filter((row) => row.category?.type === "fun")
      .reduce((sum, row) => sum + Number(row.amount), 0);

    return {
      totalIncome,
      sharedExpenses,
      personalExpenses,
      sharedSavings,
      funSpending,
      remaining: totalIncome - sharedExpenses - personalExpenses - sharedSavings - funSpending,
    };
  }, [rows]);

  const recentCategoryIds = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      if (!row.category_id) return;
      counts.set(row.category_id, (counts.get(row.category_id) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoryId]) => categoryId)
      .slice(0, 8);
  }, [rows]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [profile, allCategories] = await Promise.all([
          authApi.getProfile(),
          categoriesApi.getAll(),
        ]);

        setCategories(allCategories);
        if (profile.full_name) setUser1Name(profile.full_name);
        if (profile.partner_name) setUser2Name(profile.partner_name);
      } catch (error) {
        console.error("Failed to load budget page dependencies", error);
        setSaveError("Failed to load budget data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadMonth = async () => {
      if (isLoading || loadedMonthsRef.current.has(selectedMonth) || draftState.initialized || draftState.hasUnsavedChanges) {
        return;
      }

      try {
        const budget = await getBudgetByMonth(selectedMonth).catch(() => null);
        if (!budget) {
          loadedMonthsRef.current.add(selectedMonth);
          hydrateMonth(selectedMonth, {
            budgetId: undefined,
            rows: [],
            deletedIds: [],
            initialized: false,
            hasUnsavedChanges: false,
          });
          return;
        }

        const lineItems = await getBudgetLineItemsByBudget(budget.id);
        if (lineItems.length === 0) {
          hydrateMonth(selectedMonth, {
            budgetId: budget.id,
            rows: [],
            deletedIds: [],
            initialized: false,
            hasUnsavedChanges: false,
          });
        } else {
          hydrateMonth(selectedMonth, {
            budgetId: budget.id,
            rows: lineItems.map((item) =>
              makeDraftRow({
                id: item.id,
                name: item.name,
                category_id: item.category_id,
                amount: item.amount,
                owner_slot: item.owner_slot,
                include: true,
                source: "existing",
                needs_review: false,
                category: item.category,
              }),
            ),
            deletedIds: [],
            initialized: true,
            hasUnsavedChanges: false,
          });
        }
      } catch (error) {
        console.error("Failed to load month", error);
        setSaveError("Failed to load this month.");
      } finally {
        loadedMonthsRef.current.add(selectedMonth);
      }
    };

    loadMonth();
  }, [draftState.hasUnsavedChanges, draftState.initialized, hydrateMonth, isLoading, selectedMonth]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => rows.some((row) => row.client_id === id)));
  }, [rows]);

  const handleMonthInitialize = async (mode: "empty" | "copy_previous") => {
    setSaveError(null);
    setInfoMessage(null);
    setIsSaving(true);

    try {
      const response = await initializeBudgetMonth({ month: selectedMonth, mode });
      hydrateMonth(selectedMonth, {
        budgetId: response.budget.id,
        rows: response.rows.map((row) =>
          makeDraftRow({
            id: row.id,
            name: row.name,
            category_id: row.category_id,
            amount: row.amount,
            owner_slot: row.owner_slot,
            include: row.include,
            source: row.source,
            needs_review: row.needs_review,
            category: row.category,
          }),
        ),
        deletedIds: [],
        initialized: true,
        hasUnsavedChanges: false,
      });
      loadedMonthsRef.current.add(selectedMonth);

      if (mode === "copy_previous" && response.source_budget_month) {
        setInfoMessage(`Started ${selectedMonth} from ${response.source_budget_month}.`);
      } else if (mode === "copy_previous") {
        setInfoMessage("No previous month was available, so we started empty.");
      } else {
        setInfoMessage(`Started a new blank draft for ${selectedMonth}.`);
      }
    } catch (error) {
      console.error("Failed to initialize month", error);
      setSaveError(error instanceof Error ? error.message : "Failed to initialize month.");
    } finally {
      setIsSaving(false);
    }
  };

  const applyRowUpdate = (row: BudgetDraftRow, updates: Partial<BudgetDraftRow>) => {
    const nextRow = {
      ...row,
      ...updates,
      category:
        updates.category_id !== undefined
          ? categories.find((category) => category.id === updates.category_id)
          : row.category,
    };

    updateRow(selectedMonth, row.client_id, {
      ...updates,
      category: nextRow.category,
      needs_review: computeNeedsReview(nextRow),
    });
  };

  const handleQuickAdd = () => {
    const parsedRows = parseQuickAddLines(quickAddInput, activeTab, categories);
    if (parsedRows.length === 0) return;

    parsedRows.forEach((row) => addRow(selectedMonth, row));
    setQuickAddInput("");
    setInfoMessage(`Added ${parsedRows.length} draft row${parsedRows.length > 1 ? "s" : ""} for review.`);
  };

  const handleAddBlankRow = () => {
    addRow(selectedMonth, {
      owner_slot: getDefaultOwnerFromTab(activeTab),
      include: true,
      source: "manual",
      needs_review: true,
    });
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleBulkCategory = (categoryId: string) => {
    if (!categoryId || selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    rows
      .filter((row) => selectedSet.has(row.client_id))
      .forEach((row) => {
        applyRowUpdate(row, { category_id: categoryId });
      });
    setBulkCategoryId("");
  };

  const handleBulkOwner = (owner: OwnerSlot) => {
    if (!owner || selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    rows
      .filter((row) => selectedSet.has(row.client_id))
      .forEach((row) => {
        applyRowUpdate(row, { owner_slot: owner });
      });
    setBulkOwner("");
  };

  const handleBulkInclude = (include: boolean) => {
    const selectedSet = new Set(selectedIds);
    rows
      .filter((row) => selectedSet.has(row.client_id))
      .forEach((row) => {
        applyRowUpdate(row, { include });
      });
  };

  const handleSave = async () => {
    setSaveError(null);
    setInfoMessage(null);
    setIsSaving(true);

    try {
      const implicitDeletedIds = rows
        .filter((row) => !row.include && row.id)
        .map((row) => row.id as string);

      const response = await saveBudgetDraft({
        month: selectedMonth,
        deleted_ids: Array.from(new Set([...draftState.deletedIds, ...implicitDeletedIds])),
        rows: rows.map((row) => ({
          id: row.id,
          name: row.name,
          category_id: row.category_id,
          amount: row.amount === "" ? 0 : Number(row.amount),
          owner_slot: row.owner_slot,
          include: row.include,
          source: row.source,
          needs_review: row.needs_review,
        })),
      });

      hydrateMonth(selectedMonth, {
        budgetId: response.budget.id,
        rows: response.rows.map((row) =>
          makeDraftRow({
            id: row.id,
            name: row.name,
            category_id: row.category_id,
            amount: row.amount,
            owner_slot: row.owner_slot,
            include: row.include,
            source: "existing",
            needs_review: false,
            category: row.category,
          }),
        ),
        deletedIds: [],
        initialized: true,
        hasUnsavedChanges: false,
      });
      setSelectedIds([]);
      setInfoMessage(`Saved ${response.rows.length} budget row${response.rows.length === 1 ? "" : "s"} for ${selectedMonth}.`);
    } catch (error) {
      console.error("Failed to save draft", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save budget.");
    } finally {
      setIsSaving(false);
    }
  };

  const quickCategorySlot = (
    <QuickCategoryDialog
      defaultType={activeTab === "income" ? "income" : activeTab === "shared-savings" ? "savings" : activeTab === "fun" ? "fun" : "expense"}
      onCategoryCreated={(category) => setCategories((prev) => [...prev, category])}
    />
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Budget" subtitle="Loading your draft workspace..." />
        <div className="p-8">
          <Card className="p-8 text-sm text-gray-500">Loading budget workspace…</Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Budget"
        subtitle="Build the month once, then review every entry in one shared draft table."
        breadcrumb={["Dashboard", "Budget"]}
        action={
          <div className="flex items-center gap-3">
            {draftState.hasUnsavedChanges && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
            <Button onClick={handleSave} disabled={isSaving || !draftState.initialized}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Budget"}
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard title="Total Income" value={formatCurrency(totals.totalIncome)} tone="positive" />
          <StatCard title="Shared Expenses" value={formatCurrency(totals.sharedExpenses)} tone="negative" />
          <StatCard title="Personal Expenses" value={formatCurrency(totals.personalExpenses)} tone="negative" />
          <StatCard title="Shared Savings" value={formatCurrency(totals.sharedSavings)} tone="positive" />
          <StatCard title="Remaining" value={formatCurrency(totals.remaining)} tone={totals.remaining >= 0 ? "positive" : "negative"} />
        </div>

        {(saveError || infoMessage) && (
          <div className="space-y-3">
            {saveError && (
              <Card className="p-4 border-red-200 bg-red-50 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{saveError}</p>
              </Card>
            )}
            {infoMessage && (
              <Card className="p-4 border-green-200 bg-green-50 flex items-center gap-3">
                <Wand2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">{infoMessage}</p>
              </Card>
            )}
          </div>
        )}

        {!draftState.initialized ? (
          <Card className="p-8 bg-white border border-dashed border-gray-300">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Start This Month</p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">Choose how {selectedMonth} should begin</h2>
              <p className="mt-2 text-sm text-gray-500">
                Start from scratch or copy the most recent previous budget and adjust only what changed.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <Button onClick={() => handleMonthInitialize("empty")} disabled={isSaving}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Empty
                </Button>
                <Button variant="outline" onClick={() => handleMonthInitialize("copy_previous")} disabled={isSaving}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Last Month
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-5 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl flex-wrap">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={onlyNeedsReview}
                      onChange={(e) => setOnlyNeedsReview(e.target.checked)}
                    />
                    Needs review
                  </label>
                  {quickCategorySlot}
                  <Button variant="outline" onClick={handleAddBlankRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Fast add or paste lines</label>
                  <textarea
                    value={quickAddInput}
                    onChange={(e) => setQuickAddInput(e.target.value)}
                    placeholder={"Rent 12000\nGroceries 3500\nNetflix 129"}
                    className="w-full min-h-[120px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-3">
                    <Button onClick={handleQuickAdd} disabled={!quickAddInput.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parsed Rows
                    </Button>
                    <p className="text-xs text-gray-500">
                      Lines can stay incomplete. Anything missing will stay flagged in the review table.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Bulk actions</p>
                  <div className="mt-3 space-y-3">
                    <CategoryPickerButton
                      categories={categories}
                      value={bulkCategoryId}
                      onChange={(value) => {
                        setBulkCategoryId(value);
                        if (value) handleBulkCategory(value);
                      }}
                      recentCategoryIds={recentCategoryIds}
                      preferredType={getPreferredCategoryFilter(activeTab)}
                      placeholder="Set category for selected rows"
                      title="Apply category to selected rows"
                      description="Search once, then apply the category to every selected row."
                      allowClear={false}
                      disabled={selectedIds.length === 0}
                    />

                    <OwnerSegmentedControl
                      value={bulkOwner}
                      onChange={(owner) => {
                        setBulkOwner(owner);
                        if (owner) handleBulkOwner(owner);
                      }}
                      user1Name={user1Name}
                      user2Name={user2Name}
                      disabled={selectedIds.length === 0}
                    />

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => handleBulkInclude(true)} disabled={selectedIds.length === 0}>
                        Include
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => handleBulkInclude(false)} disabled={selectedIds.length === 0}>
                        Exclude
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      {selectedIds.length === 0 ? "Select rows to apply bulk actions." : `${selectedIds.length} row${selectedIds.length === 1 ? "" : "s"} selected.`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input type="checkbox" checked={allFilteredSelected} onChange={handleToggleSelectAll} />
                      </th>
                      <th className="px-4 py-3 text-left">Use</th>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Owner</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                          No rows match this view yet.
                        </td>
                      </tr>
                    )}

                    {filteredRows.map((row) => (
                      <tr key={row.client_id} className={!row.include ? "bg-gray-50 opacity-60" : "bg-white"}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.client_id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked ? [...prev, row.client_id] : prev.filter((id) => id !== row.client_id),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={row.include}
                            onChange={(e) => applyRowUpdate(row, { include: e.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {sourceLabel(row.source)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={row.name}
                            onChange={(e) => applyRowUpdate(row, { name: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Item name"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={row.amount}
                            onChange={(e) => applyRowUpdate(row, { amount: normalizeAmount(e.target.value) })}
                            className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 min-w-[220px]">
                          <CategoryPickerButton
                            categories={categories}
                            value={row.category_id}
                            onChange={(value) => applyRowUpdate(row, { category_id: value })}
                            recentCategoryIds={recentCategoryIds}
                            preferredType={getPreferredCategoryFilter(activeTab)}
                            placeholder="Select category"
                            title={row.name.trim() ? `Category for ${row.name}` : "Choose a category"}
                            description="Search, use a recent category, or browse the grouped list."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <OwnerSegmentedControl
                            value={row.owner_slot}
                            onChange={(value) => applyRowUpdate(row, { owner_slot: value })}
                            user1Name={user1Name}
                            user2Name={user2Name}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {row.needs_review ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                              Needs review
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200">
                              Ready
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeRow(selectedMonth, row.client_id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove row"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
