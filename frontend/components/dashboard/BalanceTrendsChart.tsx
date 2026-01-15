"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BalanceTrend } from "@/lib/api";

interface BalanceTrendsChartProps {
  data: BalanceTrend[];
}

export function BalanceTrendsChart({ data }: BalanceTrendsChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('da-DK', { month: 'short', day: 'numeric' }),
    balance: item.balance,
  }));

  // Calculate last month percentage
  const lastBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const firstBalance = data.length > 0 ? data[0].balance : 0;
  const percentChange = firstBalance !== 0 
    ? (((lastBalance - firstBalance) / Math.abs(firstBalance)) * 100).toFixed(2)
    : '0.00';

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Card className="col-span-2 shadow-xl border-0 bg-gradient-to-br from-white via-white to-purple-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Balance Trends
            </CardTitle>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-3">
              {formatCurrency(lastBalance)}
            </p>
          </div>
          <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 rounded-lg shadow-md">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Last Month</p>
            <p className="text-2xl font-bold text-green-600">12.25%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-inner">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value.toLocaleString()} kr`}
              />
              <Tooltip 
                formatter={(value: number | string | undefined) => {
                  if (!value) return ['0 kr', 'Balance'];
                  const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                  return [`${numValue.toLocaleString()} kr`, 'Balance'];
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#6366f1" 
                strokeWidth={3}
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
