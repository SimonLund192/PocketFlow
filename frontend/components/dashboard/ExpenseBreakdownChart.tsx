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
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-white to-blue-50/30">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Monthly Expenses Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No expense data available. Add expenses in the Budget page.
          </div>
        ) : (
          <>
            {/* Progress bar showing all categories */}
            <div className="flex h-4 rounded-full overflow-hidden shadow-inner bg-gray-100">
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
            <div className="space-y-5">
              {displayItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-5 last:border-0 last:pb-0 hover:bg-gray-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full shadow-md ${categoryColors[item.category] || "bg-gray-400"}`} />
                    <span className="text-base font-medium text-gray-600 capitalize">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="text-base font-medium text-gray-500">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent w-20 text-right">
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
