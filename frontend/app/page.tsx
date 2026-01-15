import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { BalanceTrendsChart } from "@/components/dashboard/BalanceTrendsChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

export default async function DashboardPage() {
  const [stats, balanceTrends, expenseBreakdown, lifetimeStats] = await Promise.all([
    api.getDashboardStats(),
    api.getBalanceTrends(),
    api.getExpenseBreakdown(),
    api.getBudgetLifetimeStats(),
  ]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

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
