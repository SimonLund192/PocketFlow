'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { BalanceTrendsChart } from "@/components/dashboard/BalanceTrendsChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

interface DashboardData {
  stats: any;
  balanceTrends: any[];
  expenseBreakdown: any[];
  lifetimeStats: any;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated) {
        // Show empty state for non-authenticated users
        setData({
          stats: {
            net_income: 0,
            total_savings: 0,
            total_expenses: 0,
            goals_achieved: 0,
            period_change_percentage: 0,
            last_month_net_income: 0,
          },
          balanceTrends: [],
          expenseBreakdown: [],
          lifetimeStats: {
            total_income: 0,
            total_shared_expenses: 0,
            total_personal_expenses: 0,
            total_shared_savings: 0,
            remaining: 0,
          },
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [stats, balanceTrends, expenseBreakdown, lifetimeStats] = await Promise.all([
          api.getDashboardStats(),
          api.getBalanceTrends(),
          api.getExpenseBreakdown(),
          api.getBudgetLifetimeStats(),
        ]);
        setData({ stats, balanceTrends, expenseBreakdown, lifetimeStats });
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to PocketFlow</h2>
          <p className="text-gray-500">Please login or create an account to view your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { lifetimeStats, balanceTrends, expenseBreakdown } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Home</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Dashboard</span>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <StatCard
          title="Total Income (Lifetime)"
          value={formatCurrency(lifetimeStats.total_income)}
          change=""
          changePercent=""
          isPositive={true}
        />
        <StatCard
          title="Shared Expenses"
          value={formatCurrency(lifetimeStats.total_shared_expenses)}
          change=""
          changePercent=""
          isPositive={false}
        />
        <StatCard
          title="Personal Expenses"
          value={formatCurrency(lifetimeStats.total_personal_expenses)}
          change=""
          changePercent=""
          isPositive={false}
        />
        <StatCard
          title="Remaining"
          value={formatCurrency(lifetimeStats.remaining)}
          change=""
          changePercent=""
          isPositive={lifetimeStats.remaining >= 0}
        />
        <StatCard
          title="Shared Savings"
          value={formatCurrency(lifetimeStats.total_shared_savings)}
          change=""
          changePercent=""
          isPositive={true}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <BalanceTrendsChart data={balanceTrends} />
        <ExpenseBreakdownChart data={expenseBreakdown} />
      </div>

      <footer className="flex items-center justify-between pt-8 border-t border-gray-200 text-sm text-gray-500">
        <p>© Copyright 2026 PocketFlow | All Rights Reserved</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-700 transition-colors">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            <Youtube className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}
