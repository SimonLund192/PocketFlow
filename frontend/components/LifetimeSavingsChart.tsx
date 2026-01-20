"use client";

import { Card } from "@/components/ui/card";
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

const data = [
  { month: "Jan. 2026", personal: 4000, shared: 8000 },
  { month: "Feb. 2026", personal: 4500, shared: 8500 },
  { month: "Mar. 2026", personal: 5000, shared: 9000 },
  { month: "Apr. 2026", personal: 5500, shared: 9500 },
  { month: "May. 2026", personal: 6000, shared: 10000 },
  { month: "Jun. 2026", personal: 6500, shared: 10500 },
  { month: "Jul. 2026", personal: 7000, shared: 11000 },
  { month: "Aug. 2026", personal: 7500, shared: 11500 },
  { month: "Sep. 2026", personal: 8000, shared: 12000 },
  { month: "Oct. 2026", personal: 8500, shared: 12500 },
  { month: "Nov. 2026", personal: 9000, shared: 13000 },
  { month: "Dec. 2026", personal: 9500, shared: 13500 },
  { month: "Jan. 2027", personal: 10000, shared: 14000 },
  { month: "Feb. 2027", personal: 10000, shared: 16000 },
];

export default function LifetimeSavingsChart() {
  return (
    <Card className="p-6 bg-white">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Lifetime Savings</h3>
        <div className="flex items-baseline gap-4">
          <p className="text-3xl font-bold text-gray-900">26.000,00 kr</p>
          <p className="text-sm text-gray-500">
            Shared: 16.000,00 kr • Personal: 10.000,00 kr
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-500">Growth</span>
          <span className="text-sm font-semibold text-green-500">+100.00%</span>
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
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                return value === 'personal' ? 'Personal Savings' : 'Shared Savings';
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
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPersonal)"
            />
            <Area
              type="monotone"
              dataKey="shared"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorShared)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
