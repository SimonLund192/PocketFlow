"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getBalanceTrends, BalanceTrend } from "@/lib/dashboard-api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function LifetimeSavingsChart() {
  const [data, setData] = useState<BalanceTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const trends = await getBalanceTrends();
        setData(trends);
      } catch (error) {
        console.error("Failed to load balance trends:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate totals from the latest data point (which represents accumulated value)
  const latest = data.length > 0 ? data[data.length - 1] : { personal: 0, shared: 0 };
  const totalPersonal = latest.personal;
  const totalShared = latest.shared;
  const total = totalPersonal + totalShared;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' kr';
  };

  if (loading) {
     return (
       <Card className="p-6 bg-white h-96 flex items-center justify-center">
         <p className="text-gray-500">Loading chart data...</p>
       </Card>
     );
  }

  return (
    <Card className="p-6 bg-white">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Lifetime Savings</h3>
        <div className="flex items-baseline gap-4">
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</p>
          <div className="flex gap-3 text-sm text-gray-500">
             <span>Shared: {formatCurrency(totalShared)}</span>
             <span>•</span>
             <span>Fun: {formatCurrency(totalPersonal)}</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorShared" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value) => value.split('.')[0]}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}.000 kr`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => `${value.toLocaleString()} kr`}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="line"
              formatter={(value) => {
                return value === 'personal' ? 'Fun' : 'Shared Savings';
              }}
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '14px'
              }}
            />
            <Area
              type="monotone"
              dataKey="personal"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorPersonal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="shared"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorShared)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
