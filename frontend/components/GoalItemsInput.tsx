"use client";

import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface GoalItem {
  url?: string;
  name: string;
  amount: number;
}

interface GoalItemsInputProps {
  items: GoalItem[];
  onChange: (items: GoalItem[]) => void;
}

export default function GoalItemsInput({ items, onChange }: GoalItemsInputProps) {
  const addItem = () => {
    onChange([...items, { url: "", name: "", amount: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index: number, field: keyof GoalItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Goal Items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
          <p className="text-sm">No items added yet</p>
          <p className="text-xs mt-1">Click "Add Item" to add items to your goal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`item-name-${index}`} className="text-xs">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`item-name-${index}`}
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder="e.g. Plane tickets"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`item-amount-${index}`} className="text-xs">
                    Amount (kr) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`item-amount-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateItem(index, "amount", parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`item-url-${index}`} className="text-xs">
                    URL (optional)
                  </Label>
                  <Input
                    id={`item-url-${index}`}
                    type="url"
                    value={item.url || ""}
                    onChange={(e) => updateItem(index, "url", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Total Amount</span>
          <span className="text-lg font-bold text-blue-600">
            {calculateTotal().toFixed(2)} kr
          </span>
        </div>
      )}
    </div>
  );
}
