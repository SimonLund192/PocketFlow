"use client";

import StatCard from "@/components/StatCard";
import LifetimeSavingsChart from "@/components/LifetimeSavingsChart";
import ExpenseBreakdown from "@/components/ExpenseBreakdown";
import { Moon, Bell, Search } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome Simon Lund</p>
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
          <span className="text-gray-900 font-medium">Dashboard</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="NET INCOME (MONTHLY)"
            value="8.969 kr."
            change="+0.0%"
            changeValue="Last month 0 kr."
            isPositive={true}
          />
          <StatCard
            title="SAVINGS (MONTHLY)"
            value="13.000 kr."
            change="+0.0%"
            changeValue="Last month 0 kr."
            isPositive={true}
          />
          <StatCard
            title="EXPENSES (MONTHLY)"
            value="13.049 kr."
            change="+0.0%"
            changeValue="Last month 0 kr."
            isPositive={true}
          />
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                GOALS ACHIEVED
              </p>
              <p className="text-5xl font-bold text-gray-900">1</p>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-400">Last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LifetimeSavingsChart />
          </div>
          <div className="lg:col-span-1">
            <ExpenseBreakdown />
          </div>
        </div>
      </div>
    </div>
  );
}
