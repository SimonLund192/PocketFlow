"use client";

import { Card } from "@/components/ui/card";
import { Home, Car, Shield, Globe, Smartphone } from "lucide-react";

interface ExpenseItem {
  name: string;
  amount: string;
  percentage: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const expenses: ExpenseItem[] = [
  {
    name: "Rent",
    amount: "17.952 kr",
    percentage: 81,
    color: "bg-purple-500",
    icon: Home,
  },
  {
    name: "Bil",
    amount: "1.720 kr",
    percentage: 8,
    color: "bg-red-500",
    icon: Car,
  },
  {
    name: "Forsikring",
    amount: "924 kr",
    percentage: 4,
    color: "bg-yellow-500",
    icon: Shield,
  },
  {
    name: "Website",
    amount: "408 kr",
    percentage: 2,
    color: "bg-pink-500",
    icon: Globe,
  },
  {
    name: "Mobil",
    amount: "354 kr",
    percentage: 2,
    color: "bg-pink-500",
    icon: Smartphone,
  },
];

export default function ExpenseBreakdown() {
  return (
    <Card className="p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Monthly Expenses Breakdown
      </h3>

      {/* Percentage Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6">
        {expenses.map((expense, index) => (
          <div
            key={index}
            className={expense.color}
            style={{ width: `${expense.percentage}%` }}
          />
        ))}
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {expenses.map((expense, index) => {
          const Icon = expense.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${expense.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {expense.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">
                  {expense.amount}
                </span>
                <span className="text-sm font-bold text-gray-900 w-8 text-right">
                  {expense.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
