"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseBreakdown } from "@/lib/api";

interface ExpenseBreakdownChartProps {
  data: ExpenseBreakdown[];
}

const categoryColors: Record<string, string> = {
  "Rent": "bg-orange-500",
  "Groceries": "bg-orange-400",
  "Utilities": "bg-yellow-500",
  "Personal Food": "bg-green-500",
  "Transport": "bg-cyan-500",
  "Entertainment": "bg-blue-500",
  "Shopping": "bg-purple-500",
  "Healthcare": "bg-pink-500",
  "Shared Savings": "bg-teal-500",
  "Personal Savings": "bg-indigo-500",
  "Household": "bg-amber-500",
};

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  // Take top 6 categories
  const topCategories = data.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monthly Expenses Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar showing all categories */}
        <div className="flex h-2 rounded-full overflow-hidden mb-6">
          {topCategories.map((item, index) => (
            <div
              key={index}
              className={categoryColors[item.category] || "bg-gray-400"}
              style={{ width: `${item.percentage}%` }}
            />
          ))}
        </div>

        {/* Category list */}
        <div className="space-y-4">
          {topCategories.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${categoryColors[item.category] || "bg-gray-400"}`} />
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">
                  ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
