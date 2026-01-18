'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { BalanceTrendsChart } from "@/components/dashboard/BalanceTrendsChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { SavingsTrendsChart } from "@/components/dashboard/SavingsTrendsChart";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

interface DashboardData {
  stats: any;
  balanceTrends: any[];
  savingsTrends: any[];
  expenseBreakdown: any[];
  lifetimeStats: any;
  monthlyStats: any;
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
          savingsTrends: [],
          expenseBreakdown: [],
          lifetimeStats: {
            total_income: 0,
            total_shared_expenses: 0,
            total_personal_expenses: 0,
            total_shared_savings: 0,
            remaining: 0,
          },
          monthlyStats: {
            current_income: 0,
            current_expenses: 0,
            current_savings: 0,
            previous_income: 0,
            previous_expenses: 0,
            previous_savings: 0,
          },
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [stats, balanceTrends, savingsTrends, budgetExpenseBreakdown, lifetimeStats, monthlyStats, goals] = await Promise.all([
          api.getDashboardStats(),
          api.getBalanceTrends(),
          api.getSavingsTrends(),
          api.getBudgetExpenseBreakdown(),
          api.getBudgetLifetimeStats(),
          api.getMonthlyStats(),
          api.getGoals(),
        ]);
        
        // Calculate goals achieved using hierarchical logic
        let remainingSavings = lifetimeStats.total_shared_savings;
        let goalsAchieved = 0;
        
        for (const goal of goals) {
          // Check if we have enough savings to complete this goal
          if (remainingSavings >= goal.target) {
            goalsAchieved++;
            remainingSavings -= goal.target;
          } else {
            // If we can't complete this goal, we can't complete any after it
            break;
          }
        }
        
        setData({ 
          stats: { ...stats, goals_achieved: goalsAchieved }, 
          balanceTrends, 
          savingsTrends, 
          expenseBreakdown: budgetExpenseBreakdown,
          lifetimeStats, 
          monthlyStats 
        });
        setError(null);
      } catch (err: any) {
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

  const { lifetimeStats, balanceTrends, savingsTrends, expenseBreakdown, monthlyStats } = data;

  // Calculate KPIs
  const totalExpenses = lifetimeStats.total_shared_expenses + lifetimeStats.total_personal_expenses;
  const netIncome = lifetimeStats.total_income - totalExpenses;
  const totalSavings = lifetimeStats.total_shared_savings;

  // Calculate monthly changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { amount: 0, percent: 0 };
    const amount = current - previous;
    const percent = (amount / Math.abs(previous)) * 100;
    return { amount, percent };
  };

  // Net Income change (current - previous for this month)
  const currentNetIncome = monthlyStats.current_income - monthlyStats.current_expenses;
  const previousNetIncome = monthlyStats.previous_income - monthlyStats.previous_expenses;
  const netIncomeChange = calculateChange(currentNetIncome, previousNetIncome);

  // Savings change
  const savingsChange = calculateChange(monthlyStats.current_savings, monthlyStats.previous_savings);

  // Expenses change (lower is better, so we invert the logic)
  const expensesChange = calculateChange(monthlyStats.current_expenses, monthlyStats.previous_expenses);

  return (
    <div className="space-y-8 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Home</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Dashboard</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-8">
        <StatCard
          title="Net Income (Monthly)"
          value={formatCurrency(currentNetIncome)}
          change={formatCurrency(Math.abs(netIncomeChange.amount))}
          changePercent={`${netIncomeChange.percent >= 0 ? '+' : ''}${netIncomeChange.percent.toFixed(1)}%`}
          isPositive={netIncomeChange.amount >= 0}
        />
        <StatCard
          title="Savings (Monthly)"
          value={formatCurrency(monthlyStats.current_savings)}
          change={formatCurrency(Math.abs(savingsChange.amount))}
          changePercent={`${savingsChange.percent >= 0 ? '+' : ''}${savingsChange.percent.toFixed(1)}%`}
          isPositive={savingsChange.amount >= 0}
        />
        <StatCard
          title="Expenses (Monthly)"
          value={formatCurrency(monthlyStats.current_expenses)}
          change={formatCurrency(Math.abs(expensesChange.amount))}
          changePercent={`${expensesChange.percent >= 0 ? '+' : ''}${expensesChange.percent.toFixed(1)}%`}
          isPositive={expensesChange.amount <= 0}
        />
        <StatCard
          title="Goals Achieved"
          value={`${data.stats.goals_achieved}`}
          change=""
          changePercent=""
          isPositive={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-8">
            <BalanceTrendsChart data={balanceTrends} />
            <ExpenseBreakdownChart data={expenseBreakdown} />
          </div>
        </div>
        <AIAssistantPanel />
      </div>

      {/* Footer */}
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
