"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BalanceTrend } from "@/lib/api";

interface BalanceTrendsChartProps {
  data: BalanceTrend[];
}

export function BalanceTrendsChart({ data }: BalanceTrendsChartProps) {
  // Format data for the chart - show month/year for better readability
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('da-DK', { month: 'short', year: 'numeric' }),
    "Shared Savings": item.shared_savings,
    "Personal Savings": item.personal_savings,
  }));

  // Calculate percentage change from start to end for shared savings
  const lastSharedSavings = data.length > 0 ? (data[data.length - 1]?.shared_savings ?? 0) : 0;
  const firstSharedSavings = data.length > 0 ? (data[0]?.shared_savings ?? 0) : 0;
  const lastPersonalSavings = data.length > 0 ? (data[data.length - 1]?.personal_savings ?? 0) : 0;
  
  const percentChange = firstSharedSavings !== 0 
    ? (((lastSharedSavings - firstSharedSavings) / Math.abs(firstSharedSavings)) * 100).toFixed(2)
    : '0.00';
  
  const isPositive = parseFloat(percentChange) >= 0;

  // Calculate total savings (shared + personal)
  const totalSavings = lastSharedSavings + lastPersonalSavings;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Lifetime Savings</CardTitle>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalSavings.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Shared: {lastSharedSavings.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr
              {" • "}
              Personal: {lastPersonalSavings.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Growth</p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{percentChange}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorShared" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7FFF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6B7FFF" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value.toLocaleString('da-DK')} kr`}
            />
            <Tooltip 
              formatter={(value: number | string | undefined, name: string | undefined) => {
                if (!value) return ['0 kr', name || 'Savings'];
                const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                return [`${numValue.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`, name || 'Savings'];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="line"
            />
            <Area 
              type="monotone" 
              dataKey="Shared Savings" 
              stroke="#6B7FFF" 
              strokeWidth={2}
              fill="url(#colorShared)" 
            />
            <Area 
              type="monotone" 
              dataKey="Personal Savings" 
              stroke="#10B981" 
              strokeWidth={2}
              fill="url(#colorPersonal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
