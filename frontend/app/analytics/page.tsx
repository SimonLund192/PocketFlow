"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import KPICard from "@/components/KPICard";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("Analytics");

  const tabs = [
    "Analytics",
    "Expenses",
    "Income",
    "Income vs Expenses",
    "Balance",
    "Transaction History",
  ];

  // Sample data for the bar chart
  const weeklyExpensesData = [
    { month: "Jan", value: 48 },
    { month: "Feb", value: 55 },
    { month: "Mar", value: 80 },
    { month: "Apr", value: 65 },
    { month: "May", value: 75 },
    { month: "Jun", value: 38 },
    { month: "Jul", value: 45 },
    { month: "Aug", value: 65 },
    { month: "Sep", value: 60 },
    { month: "Oct", value: 48 },
    { month: "Nov", value: 72 },
    { month: "Dec", value: 68 },
    { month: "Jan", value: 70 },
    { month: "Feb", value: 55 },
    { month: "Mar", value: 42 },
    { month: "Apr", value: 52 },
    { month: "May", value: 58 },
    { month: "Jun", value: 50 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Analytics" 
        subtitle="Showing insights for your most recent activity." 
        breadcrumb={["Dashboard", "Analytics"]} 
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <KPICard 
            title="Daily Average" 
            value="$68.00" 
            change="Avg spend per day (last 30 days)" 
          />
          <KPICard 
            title="Change" 
            value="+12%" 
            change="Compared to previous 30 days" 
            isPositive={true}
          />
          <KPICard 
            title="Total Transactions" 
            value="315" 
            change="Last 90 days" 
          />
          <KPICard 
            title="Categories" 
            value="14" 
            change="Active spending categories" 
          />
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Weekly Expenses Chart */}
        <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Weekly Expenses</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyExpensesData} barSize={30}>
                <CartesianGrid strokeDasharray="0" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  ticks={[0, 20, 40, 60, 80]}
                  dx={-10}
                />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
