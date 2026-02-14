"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Pencil, Check, X, GripVertical } from "lucide-react";
import { Category } from "@/lib/categories-api";
import BudgetLineItemFormCard, {
  BudgetLineItemFormValues,
} from "@/components/BudgetLineItemFormDialog";

export interface BudgetItem {
  id: string;
  name: string;
  category: string;
  amount: number;
}

export interface BudgetColumn {
  title?: string;
  items: BudgetItem[];
  ownerSlot: "user1" | "user2" | "shared";
  onAddItem: (values: BudgetLineItemFormValues) => void;
  onUpdateItem: (
    id: string,
    field: "name" | "category" | "amount",
    value: string | number
  ) => void;
  onRemoveItem: (id: string) => void;
  categories: Category[];
  namePlaceholder: string;
  addButtonText: string;
}

interface BudgetTabContentProps {
  description?: string;
  layout: "single" | "double";
  columns: BudgetColumn[];
  /** Optional React node rendered in the left column above the form (e.g. "+ New Category" button) */
  leftHeaderSlot?: React.ReactNode;
  /** Optional React node rendered at the top of the right column (e.g. tab navigation) */
  rightHeaderSlot?: React.ReactNode;
}

/** Inline-edit row for a single budget item */
function InlineEditRow({
  item,
  categories,
  onUpdate,
  onRemove,
  namePlaceholder,
}: {
  item: BudgetItem;
  categories: Category[];
  onUpdate: (
    id: string,
    field: "name" | "category" | "amount",
    value: string | number
  ) => void;
  onRemove: (id: string) => void;
  namePlaceholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editAmount, setEditAmount] = useState<number | "">(item.amount || "");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (editing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editing]);

  // Sync local state when item updates from parent
  useEffect(() => {
    if (!editing) {
      setEditName(item.name);
      setEditCategory(item.category);
      setEditAmount(item.amount || "");
    }
  }, [item.name, item.category, item.amount, editing]);

  const cat = categories.find((c) => c.id === item.category);

  const commitEdits = () => {
    if (editName !== item.name) onUpdate(item.id, "name", editName);
    if (editCategory !== item.category)
      onUpdate(item.id, "category", editCategory);
    if (Number(editAmount) !== item.amount)
      onUpdate(item.id, "amount", Number(editAmount) || 0);
    setEditing(false);
  };

  const cancelEdits = () => {
    setEditName(item.name);
    setEditCategory(item.category);
    setEditAmount(item.amount || "");
    setEditing(false);
  };

  // ── Editing mode ──
  if (editing) {
    return (
      <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl transition-all">
        {/* Category badge */}
        <div className="flex-shrink-0">
          {cat ? (
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: cat.color + "22" }}
            >
              {cat.icon}
            </span>
          ) : (
            <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              —
            </span>
          )}
        </div>

        {/* Editable fields */}
        <div className="flex-1 grid grid-cols-[1fr_140px_120px] gap-2 items-center">
          <input
            ref={nameInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={namePlaceholder}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdits();
              if (e.key === "Escape") cancelEdits();
            }}
          />
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="number"
              value={editAmount}
              onChange={(e) =>
                setEditAmount(
                  e.target.value === "" ? "" : parseFloat(e.target.value)
                )
              }
              placeholder="0"
              className="w-full px-2.5 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-right"
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdits();
                if (e.key === "Escape") cancelEdits();
              }}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              kr.
            </span>
          </div>
        </div>

        {/* Confirm / Cancel */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={commitEdits}
            className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdits}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Read-only mode ──
  return (
    <div className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all">
      {/* Grip handle */}
      <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

      {/* Category badge */}
      <div className="flex-shrink-0">
        {cat ? (
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
            style={{ backgroundColor: cat.color + "22" }}
          >
            {cat.icon}
          </span>
        ) : (
          <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            —
          </span>
        )}
      </div>

      {/* Name + category label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.name || (
            <span className="text-gray-400 italic">Unnamed item</span>
          )}
        </p>
        {cat && (
          <p className="text-xs text-gray-500 truncate">{cat.name}</p>
        )}
      </div>

      {/* Amount */}
      <p className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">
        {item.amount > 0
          ? `${item.amount.toLocaleString()} kr.`
          : "\u2014"}
      </p>

      {/* Actions (visible on hover) */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Renders the right-side items list for a single column */
function ColumnItemsList({ column }: { column: BudgetColumn }) {
  const total = column.items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-1">
      {/* Column header (for double layout) */}
      {column.title && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900">
            {column.title}
          </h4>
          <span className="text-sm font-medium text-gray-500 tabular-nums">
            {total.toLocaleString()} kr.
          </span>
        </div>
      )}

      {/* Empty state */}
      {column.items.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No items yet</p>
        </div>
      )}

      {/* Items list */}
      {column.items.map((item) => (
        <InlineEditRow
          key={item.id}
          item={item}
          categories={column.categories}
          onUpdate={column.onUpdateItem}
          onRemove={column.onRemoveItem}
          namePlaceholder={column.namePlaceholder}
        />
      ))}

      {/* Total row */}
      {column.items.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {total.toLocaleString()} kr.
          </span>
        </div>
      )}
    </div>
  );
}

export default function BudgetTabContent({
  description,
  layout,
  columns,
  leftHeaderSlot,
  rightHeaderSlot,
}: BudgetTabContentProps) {
  // For double layout, track which column the form targets
  const [activeFormColumn, setActiveFormColumn] = useState(0);

  // Determine form props based on the active column
  const formColumn = columns[activeFormColumn] ?? columns[0];

  return (
    <div className="space-y-4">
      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}

      {/* Grid: Left form + Right list (matching Account page Categories layout) */}
      <div className="grid grid-cols-[480px_1fr] gap-x-6 gap-y-4 items-start">
        {/* Left Header — Column picker (double layout) + New Category button */}
        <div className="flex items-center gap-2 flex-wrap min-h-[40px]">
          {layout === "double" && columns.length > 1 && (
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {columns.map((col, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFormColumn(idx)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeFormColumn === idx
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {col.title ?? `Column ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
          {leftHeaderSlot}
        </div>

        {/* Right Header — Tabs */}
        <div className="flex items-center min-h-[40px]">
          {rightHeaderSlot}
        </div>

        {/* Left Column — Add Item Form */}
        <div>
          <BudgetLineItemFormCard
            categories={formColumn.categories}
            onSubmit={(values) => formColumn.onAddItem(values)}
            title={formColumn.addButtonText.replace("Add ", "Add a new ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          />
        </div>

        {/* Right Column — Items Lists */}
        <div className="space-y-6">
          {layout === "double" ? (
            columns.map((column, colIdx) => (
              <div
                key={colIdx}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <ColumnItemsList column={column} />
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <ColumnItemsList column={columns[0]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
