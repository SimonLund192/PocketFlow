"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export function StatCard({ title, value, change, changePercent, isPositive }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {changePercent}
          </span>
          <span className="text-sm text-gray-500">Last month {change}</span>
        </div>
      </CardContent>
    </Card>
  );
}
