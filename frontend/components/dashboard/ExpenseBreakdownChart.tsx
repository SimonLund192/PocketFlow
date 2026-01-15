"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetExpenseBreakdown } from "@/lib/api";

interface ExpenseBreakdownChartProps {
  data: BudgetExpenseBreakdown[];
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
  "Uncategorized": "bg-gray-400",
};

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  // Take top items (show all since we're now splitting by type)
  const displayItems = data.slice(0, 10);

  // Calculate total for the progress bar
  const totalPercentage = displayItems.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Monthly Expenses Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No expense data available. Add expenses in the Budget page.
          </div>
        ) : (
          <>
            {/* Progress bar showing all categories */}
            <div className="flex h-3 rounded-full overflow-hidden">
              {displayItems.map((item, index) => (
                <div
                  key={index}
                  className={categoryColors[item.category] || "bg-gray-400"}
                  style={{ width: `${(item.percentage / totalPercentage * 100) || 0}%` }}
                  title={`${item.category} (${item.type}): ${item.percentage.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Category list */}
            <div className="space-y-6">
              {displayItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${categoryColors[item.category] || "bg-gray-400"}`} />
                    <span className="text-base font-normal text-gray-500 capitalize">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-base font-normal text-gray-500">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-2xl font-bold text-gray-900 w-20 text-right">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
