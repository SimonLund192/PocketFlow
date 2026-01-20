"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeValue: string;
  isPositive?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeValue,
  isPositive = true 
}: StatCardProps) {
  return (
    <Card className="p-6 bg-white">
      <div className="space-y-2">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900">
          {value}
        </p>
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
          <span className="text-gray-400">
            {changeValue}
          </span>
        </div>
      </div>
    </Card>
  );
}
