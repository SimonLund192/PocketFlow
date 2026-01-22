import { Plus, Trash2 } from "lucide-react";
import { Category } from "@/lib/categories-api";

interface BudgetItem {
  id: string;
  name: string;
  category: string;
  amount: number;
}

interface BudgetColumn {
  title?: string;
  items: BudgetItem[];
  onAddItem: () => void;
  onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) => void;
  onRemoveItem: (id: string) => void;
  categories: Category[];
  namePlaceholder: string;
  addButtonText: string;
}

interface BudgetTabContentProps {
  description?: string;
  layout: "single" | "double";
  columns: BudgetColumn[];
  saveButtonText: string;
  onSave: () => Promise<void>;
}

export default function BudgetTabContent({
  description,
  layout,
  columns,
  saveButtonText,
  onSave,
}: BudgetTabContentProps) {
  return (
    <>
      <div className="space-y-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 mb-4">{description}</p>
        )}

        {/* Layout Container */}
        <div className={layout === "double" ? "grid grid-cols-2 gap-8" : ""}>
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-4">
              {/* Column Title (for double layout) */}
              {column.title && layout === "double" && (
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {column.title}
                  </h4>
                </div>
              )}

              {/* Items */}
              {column.items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 p-4 border border-gray-200 rounded-lg"
                >
                  {/* Name and Delete */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        column.onUpdateItem(item.id, "name", e.target.value)
                      }
                      placeholder={column.namePlaceholder}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => column.onRemoveItem(item.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Category and Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        column.onUpdateItem(item.id, "category", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Category</option>
                      {column.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        column.onUpdateItem(
                          item.id,
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Amount"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add Button */}
              <button
                onClick={column.onAddItem}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
              >
                <Plus className="w-4 h-4" />
                {column.addButtonText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onSave}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
          </svg>
          {saveButtonText}
        </button>
      </div>
    </>
  );
}
