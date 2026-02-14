"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_TYPES,
  PRESET_ICONS,
  PRESET_COLORS,
} from "@/lib/category-utils";

export interface CategoryFormValues {
  name: string;
  type: "income" | "expense" | "savings" | "fun";
  icon: string;
  color: string;
}

interface CategoryFormFieldsProps {
  values: CategoryFormValues;
  onChange: (values: CategoryFormValues) => void;
  /** Hide the type picker (e.g. when type is pre-selected) */
  hideType?: boolean;
  /** Error message to show */
  error?: string | null;
}

/**
 * Reusable category form fields — name, type buttons, emoji icon grid, color palette.
 * Used both inside the QuickCategoryDialog (modal) and the Account page (inline card).
 */
export default function CategoryFormFields({
  values,
  onChange,
  hideType = false,
  error,
}: CategoryFormFieldsProps) {
  const update = (patch: Partial<CategoryFormValues>) =>
    onChange({ ...values, ...patch });

  return (
    <div className="grid gap-4">
      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="cat-form-name">Name</Label>
        <Input
          id="cat-form-name"
          value={values.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Groceries"
        />
      </div>

      {/* Type */}
      {!hideType && (
        <div className="grid gap-2">
          <Label>Type</Label>
          <div className="flex gap-2">
            {CATEGORY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ type: t.value })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  values.type === t.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Icon picker */}
      <div className="grid gap-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => update({ icon: ic })}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-colors ${
                values.icon === ic
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="grid gap-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update({ color: c })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                values.color === c
                  ? "border-gray-900 scale-110"
                  : "border-transparent hover:border-gray-400"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
