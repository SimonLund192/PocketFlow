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
import { categoriesApi, Category } from "@/lib/categories-api";
import { Plus } from "lucide-react";
import CategoryFormFields, { CategoryFormValues } from "@/components/CategoryFormFields";

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
  const [formValues, setFormValues] = useState<CategoryFormValues>({
    name: "",
    type: defaultType,
    icon: "💰",
    color: "#3b82f6",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opening
  const handleOpen = () => {
    setFormValues({
      name: "",
      type: defaultType,
      icon: "💰",
      color: "#3b82f6",
    });
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const created = await categoriesApi.create({
        name: formValues.name.trim(),
        type: formValues.type,
        icon: formValues.icon,
        color: formValues.color,
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
        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
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

            <div className="py-4">
              <CategoryFormFields
                values={formValues}
                onChange={setFormValues}
                error={error}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formValues.name.trim()}>
                {loading ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
