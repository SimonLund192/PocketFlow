import { Category } from "@/lib/categories-api";

export type BudgetDraftSource = "existing" | "manual" | "ai" | "import" | "copied";
export type BudgetOwnerSlot = "user1" | "user2" | "shared";
export type BudgetDraftCategory = Pick<Category, "id" | "name" | "type" | "icon" | "color"> &
  Partial<Pick<Category, "user_id">>;
export type BudgetTabType =
  | "all"
  | "income"
  | "shared-expenses"
  | "personal-expenses"
  | "shared-savings"
  | "fun";

export interface BudgetDraftRow {
  client_id: string;
  id?: string;
  name: string;
  category_id: string;
  amount: number | "";
  owner_slot: BudgetOwnerSlot;
  include: boolean;
  source: BudgetDraftSource;
  needs_review: boolean;
  category?: BudgetDraftCategory;
}

export interface BudgetDraftState {
  budgetId?: string;
  rows: BudgetDraftRow[];
  deletedIds: string[];
  initialized: boolean;
  hasUnsavedChanges: boolean;
}

export function makeDraftRow(
  partial: Partial<BudgetDraftRow> = {},
): BudgetDraftRow {
  return {
    client_id: partial.client_id || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    id: partial.id,
    name: partial.name || "",
    category_id: partial.category_id || "",
    amount: partial.amount ?? "",
    owner_slot: partial.owner_slot || "user1",
    include: partial.include ?? true,
    source: partial.source || "manual",
    needs_review: partial.needs_review ?? false,
    category: partial.category,
  };
}

export function getRowCategoryType(row: BudgetDraftRow): Category["type"] | null {
  return row.category?.type || null;
}

export function rowMatchesTab(row: BudgetDraftRow, tab: BudgetTabType): boolean {
  const type = getRowCategoryType(row);
  if (tab === "all") {
    return true;
  }
  if (tab === "income") {
    return type === "income";
  }
  if (tab === "shared-expenses") {
    return type === "expense" && row.owner_slot === "shared";
  }
  if (tab === "personal-expenses") {
    return type === "expense" && row.owner_slot !== "shared";
  }
  if (tab === "shared-savings") {
    return type === "savings" && row.owner_slot === "shared";
  }
  if (tab === "fun") {
    return type === "fun";
  }
  return true;
}
