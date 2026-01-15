"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BalanceTrend } from "@/lib/api";

interface BalanceTrendsChartProps {
  data: BalanceTrend[];
}

export function BalanceTrendsChart({ data }: BalanceTrendsChartProps) {
  console.log("BalanceTrendsChart data:", data);
  
  // Format data for the chart - show month/year for better readability
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('da-DK', { month: 'short', year: 'numeric' }),
    balance: item.balance,
  }));

  console.log("BalanceTrendsChart chartData:", chartData);

  // Calculate percentage change from start to end
  const lastBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const firstBalance = data.length > 0 ? data[0].balance : 0;
  const percentChange = firstBalance !== 0 
    ? (((lastBalance - firstBalance) / Math.abs(firstBalance)) * 100).toFixed(2)
    : '0.00';
  
  const isPositive = parseFloat(percentChange) >= 0;

  console.log("Last balance:", lastBalance, "First balance:", firstBalance, "Percent change:", percentChange);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Lifetime Savings</CardTitle>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {lastBalance.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr
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
              tickFormatter={(value) => `${value.toLocaleString('da-DK')} kr`}
            />
            <Tooltip 
              formatter={(value: number | string | undefined) => {
                if (!value) return ['0 kr', 'Savings'];
                const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                return [`${numValue.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`, 'Savings'];
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
