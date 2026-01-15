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
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Balance Trends</CardTitle>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(lastBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Month</p>
            <p className="text-lg font-semibold text-green-500">12.25%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7FFF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6B7FFF" stopOpacity={0}/>
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
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#6B7FFF" 
              strokeWidth={2}
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
