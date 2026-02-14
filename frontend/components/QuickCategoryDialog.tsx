"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoriesApi, Category } from "@/lib/categories-api";
import { Plus } from "lucide-react";

const CATEGORY_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "savings", label: "Savings" },
  { value: "fun", label: "Fun" },
] as const;

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#f43f5e", "#06b6d4", "#84cc16",
];

const PRESET_ICONS = [
  "💰", "🏠", "🛒", "💡", "🚗", "⛽", "📱", "📺",
  "🎬", "🍽️", "👕", "🐾", "🎁", "✈️", "🎮", "🛍️",
  "🏋️", "📦", "🎓", "🛡️", "💻", "🎨", "🌍", "📈",
];

interface QuickCategoryDialogProps {
  /** Pre-select a category type based on the active budget tab */
  defaultType?: "income" | "expense" | "savings" | "fun";
  /** Called after a category is successfully created */
  onCategoryCreated: (category: Category) => void;
}

export default function QuickCategoryDialog({
  defaultType = "expense",
  onCategoryCreated,
}: QuickCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense" | "savings" | "fun">(defaultType);
  const [icon, setIcon] = useState("💰");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opening
  const handleOpen = () => {
    setName("");
    setType(defaultType);
    setIcon("💰");
    setColor("#3b82f6");
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const created = await categoriesApi.create({
        name: name.trim(),
        type,
        icon,
        color,
      });
      onCategoryCreated(created);
      setOpen(false);
    } catch (_err) {
      setError("Failed to create category. It may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Category
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>
                Add a new category to use in your budget.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groceries"
                  required
                  autoFocus
                />
              </div>

              {/* Type */}
              <div className="grid gap-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {CATEGORY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        type === t.value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div className="grid gap-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-colors ${
                        icon === ic
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
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c
                          ? "border-gray-900 scale-110"
                          : "border-transparent hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
