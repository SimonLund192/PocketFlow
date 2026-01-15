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
    <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
      <CardContent className="p-6 relative z-10">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
        <div className="flex items-baseline justify-between">
          <p className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {changePercent}
          </span>
          <span className="text-sm text-gray-400">Last month {change}</span>
        </div>
      </CardContent>
    </Card>
  );
}
