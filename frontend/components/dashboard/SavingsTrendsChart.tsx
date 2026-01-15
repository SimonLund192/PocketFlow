"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SavingsTrend } from "@/lib/api";

interface SavingsTrendsChartProps {
  data: SavingsTrend[];
}

export function SavingsTrendsChart({ data }: SavingsTrendsChartProps) {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Get latest savings data
  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const totalSavings = latestData?.total_savings || 0;
  const sharedSavings = latestData?.shared_savings || 0;
  const personalSavings = latestData?.personal_savings || 0;

  // Calculate percentage growth
  const calculateGrowth = (current: number, initial: number) => {
    if (initial === 0) return 0;
    return (((current - initial) / Math.abs(initial)) * 100).toFixed(1);
  };

  const initialTotal = data.length > 0 ? data[0].total_savings : 0;
  const growthPercent = calculateGrowth(totalSavings, initialTotal);

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-white to-emerald-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Cumulative Savings Growth
            </CardTitle>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mt-3">
              {formatCurrency(totalSavings)}
            </p>
          </div>
          <div className="text-right bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-3 rounded-lg shadow-md">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Growth</p>
            <p className="text-2xl font-bold text-emerald-600">{growthPercent}%</p>
          </div>
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Shared: {formatCurrency(sharedSavings)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Personal: {formatCurrency(personalSavings)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No savings data available. Add savings in the Budget page.
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-inner">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <defs>
                  <linearGradient id="sharedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="personalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k kr`}
                />
                <Tooltip 
                  formatter={(value: number | undefined) => {
                    if (!value) return ['0 kr', ''];
                    return [`${formatCurrency(value)}`, ''];
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="shared_savings" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Shared Savings"
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="personal_savings" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Personal Savings"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_savings" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total Savings"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
