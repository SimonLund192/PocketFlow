"use client";

import StatCard from "@/components/StatCard";
import LifetimeSavingsChart from "@/components/LifetimeSavingsChart";
import ExpenseBreakdown from "@/components/ExpenseBreakdown";
import Header from "@/components/Header";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Dashboard" 
        subtitle="Welcome Simon Lund" 
        breadcrumb={["Dashboard"]} 
      />

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
