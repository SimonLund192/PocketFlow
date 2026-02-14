"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getExpenseBreakdown, ExpenseBreakdown as ExpenseBreakdownType } from "@/lib/dashboard-api";
import { useMonth } from "@/contexts/MonthContext";
import { isEmojiIcon, isHexColor, getIconComponent, getColorClass } from "@/lib/category-utils";

export default function ExpenseBreakdown() {
  const { selectedMonth } = useMonth();
  const [data, setData] = useState<ExpenseBreakdownType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const breakdown = await getExpenseBreakdown(selectedMonth);
        setData(breakdown);
      } catch (error) {
        console.error("Failed to load expense breakdown:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' kr';
  };

  if (loading) {
     return (
       <Card className="p-6 bg-white h-full flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Monthly Expenses
          </h3>
          <div className="flex-1 flex items-center justify-center text-gray-500">
             Loading...
          </div>
       </Card>
     );
  }

  if (data.length === 0) {
      return (
        <Card className="p-6 bg-white h-full flex flex-col">
             <h3 className="text-lg font-semibold text-gray-900 mb-6">
               Monthly Expenses
             </h3>
             <div className="flex-1 flex items-center justify-center text-gray-500">
                No expenses
             </div>
        </Card>
      );
  }

  return (
    <Card className="p-6 bg-white h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Monthly Expenses
      </h3>

      {/* Percentage Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6 bg-gray-100">
        {data.map((item, index) => {
           const colorCls = getColorClass(item.color);
           const useHex = isHexColor(item.color);
           return (
            <div
              key={index}
              className={useHex ? "" : colorCls}
              style={{
                width: `${item.percentage}%`,
                ...(useHex ? { backgroundColor: item.color } : {}),
              }}
              title={`${item.category}: ${item.percentage}%`}
            />
           );
        })}
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const emoji = isEmojiIcon(item.icon);
          const hexColor = isHexColor(item.color);
          const colorCls = hexColor ? "" : getColorClass(item.color);
          const Icon = emoji ? null : getIconComponent(item.icon);
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full ${colorCls} flex items-center justify-center shrink-0`}
                  style={hexColor ? { backgroundColor: item.color } : undefined}
                >
                  {emoji ? (
                    <span className="text-base leading-none">{item.icon}</span>
                  ) : Icon ? (
                    <Icon className="w-4 h-4 text-white" />
                  ) : null}
                </div>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-sm font-bold text-gray-500 w-10 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
