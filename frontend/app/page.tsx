"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import LifetimeSavingsChart from "@/components/LifetimeSavingsChart";
import ExpenseBreakdown from "@/components/ExpenseBreakdown";
import Header from "@/components/Header";
import AIChat from "@/components/AIChat";
import { getDashboardStats, DashboardStats } from "@/lib/dashboard-api";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' kr.';
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) return "+0.0%";
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

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
            value={loading || !stats ? "Loading..." : formatCurrency(stats.net_income)}
            change={loading || !stats ? "+0.0%" : formatChange(stats.income_change)}
            changeValue="Last month 0 kr."
            isPositive={true}
          />
          <StatCard
            title="SAVINGS (MONTHLY)"
            value={loading || !stats ? "Loading..." : formatCurrency(stats.savings)}
            change={loading || !stats ? "+0.0%" : formatChange(stats.savings_change)}
            changeValue="Last month 0 kr."
            isPositive={true}
          />
          <StatCard
            title="EXPENSES (MONTHLY)"
            value={loading || !stats ? "Loading..." : formatCurrency(stats.expenses)}
            change={loading || !stats ? "+0.0%" : formatChange(stats.expenses_change)}
            changeValue="Last month 0 kr."
            isPositive={true}
          />
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                GOALS ACHIEVED
              </p>
              <p className="text-5xl font-bold text-gray-900">
                {loading || !stats ? "..." : stats.goals_achieved}
              </p>
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

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
}
