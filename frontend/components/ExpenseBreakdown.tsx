"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Home, Car, Shield, Globe, Smartphone, ShoppingBag, Zap, Coffee, CreditCard } from "lucide-react";
import { getExpenseBreakdown, ExpenseBreakdown as ExpenseBreakdownType } from "@/lib/dashboard-api";

// Helper to map category names to colors/icons
const getCategoryStyle = (categoryName: string) => {
  const normalized = categoryName.toLowerCase();
  
  if (normalized.includes("rent") || normalized.includes("housing")) return { color: "bg-purple-500", icon: Home };
  if (normalized.includes("car") || normalized.includes("transport")) return { color: "bg-red-500", icon: Car };
  if (normalized.includes("insurance")) return { color: "bg-yellow-500", icon: Shield };
  if (normalized.includes("web") || normalized.includes("internet")) return { color: "bg-blue-500", icon: Globe };
  if (normalized.includes("phone") || normalized.includes("mobile")) return { color: "bg-pink-500", icon: Smartphone };
  if (normalized.includes("grocer") || normalized.includes("food")) return { color: "bg-green-500", icon: ShoppingBag };
  if (normalized.includes("util")) return { color: "bg-orange-500", icon: Zap };
  if (normalized.includes("fun") || normalized.includes("entertainment")) return { color: "bg-indigo-500", icon: Coffee };
  
  return { color: "bg-gray-500", icon: CreditCard };
};

export default function ExpenseBreakdown() {
  const [data, setData] = useState<ExpenseBreakdownType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const breakdown = await getExpenseBreakdown();
        setData(breakdown);
      } catch (error) {
        console.error("Failed to load expense breakdown:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
           const style = getCategoryStyle(item.category);
           return (
            <div
              key={index}
              className={`${style.color}`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.category}: ${item.percentage}%`}
            />
           );
        })}
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const style = getCategoryStyle(item.category);
          const Icon = style.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${style.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
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
