"use client";

import { useState } from "react";
import { Moon, Bell, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Showing insights for your most recent activity.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Here"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Moon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              SL
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Analytics</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Daily Average */}
          <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Daily Average</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">$68.00</p>
            <p className="text-sm text-gray-500">Avg spend per day (last 30 days)</p>
          </Card>

          {/* Change */}
          <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Change</h3>
            <p className="text-3xl font-bold text-green-600 mb-1">+12%</p>
            <p className="text-sm text-gray-500">Compared to previous 30 days</p>
          </Card>

          {/* Total Transactions */}
          <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transactions</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">315</p>
            <p className="text-sm text-gray-500">Last 90 days</p>
          </Card>

          {/* Categories */}
          <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Categories</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">14</p>
            <p className="text-sm text-gray-500">Active spending categories</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
          ))}
        </div>

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
