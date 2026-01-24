"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import KPICard from "@/components/KPICard";
import { transactionsApi, Transaction } from "@/lib/transactions-api";
import { 
  Scissors, 
  FileText, 
  Car, 
  GraduationCap, 
  Film, 
  ShoppingBag,
  Utensils,
  Home,
  HeartPulse,
  Briefcase,
  PiggyBank
} from "lucide-react";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch transactions for all tabs that need data
    if (activeTab === "Transaction History" || activeTab === "Expenses") {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionsApi.getAll();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes('beauty')) return <Scissors className="w-5 h-5 text-white" />;
    if (normalized.includes('bill') || normalized.includes('fee')) return <FileText className="w-5 h-5 text-white" />;
    if (normalized.includes('car') || normalized.includes('transport')) return <Car className="w-5 h-5 text-white" />;
    if (normalized.includes('education')) return <GraduationCap className="w-5 h-5 text-white" />;
    if (normalized.includes('entertainment') || normalized.includes('fun')) return <Film className="w-5 h-5 text-white" />;
    if (normalized.includes('shop')) return <ShoppingBag className="w-5 h-5 text-white" />;
    if (normalized.includes('food') || normalized.includes('restaurant')) return <Utensils className="w-5 h-5 text-white" />;
    if (normalized.includes('rent') || normalized.includes('home')) return <Home className="w-5 h-5 text-white" />;
    if (normalized.includes('health')) return <HeartPulse className="w-5 h-5 text-white" />;
    if (normalized.includes('salary') || normalized.includes('income')) return <Briefcase className="w-5 h-5 text-white" />;
    if (normalized.includes('savings')) return <PiggyBank className="w-5 h-5 text-white" />;
    return <FileText className="w-5 h-5 text-white" />;
  };

  const getCategoryColor = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes('beauty')) return "bg-emerald-400";
    if (normalized.includes('bill')) return "bg-teal-500";
    if (normalized.includes('car')) return "bg-cyan-500";
    if (normalized.includes('education')) return "bg-sky-500";
    if (normalized.includes('entertainment')) return "bg-indigo-500";
    if (normalized.includes('income')) return "bg-green-500";
    if (normalized.includes('expense')) return "bg-red-500";
    return "bg-gray-400";
  };

  // Calculate expense breakdown
  const getExpenseBreakdown = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const byCategory: Record<string, number> = {};
    expenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  };

  const COLORS = ['#4F46E5', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF'];

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
        title={activeTab === "Transaction History" ? "Transaction History" : "Analytics"}
        subtitle={activeTab === "Transaction History" || activeTab === "Expenses" ? "Welcome Ekash Finance Management" : "Showing insights for your most recent activity."}
        breadcrumb={activeTab === "Transaction History" ? ["Home", "Transaction History"] : ["Dashboard", "Analytics"]} 
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards - Only show on main Analytics tab */}
        {activeTab === "Analytics" && (
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
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Expenses Tab */}
        {activeTab === "Expenses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Expenses Breakdown */}
            <Card className="p-8 bg-white border border-gray-200 rounded-2xl lg:col-span-1">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Expenses Breakdown</h3>
              
              <div className="h-[250px] w-full mb-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getExpenseBreakdown()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getExpenseBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {getExpenseBreakdown().map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0">
                    <span className="font-semibold text-gray-700">{item.name}</span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${item.value.toFixed(0)}</div>
                      <div className="text-sm font-bold text-gray-900">{item.percentage.toFixed(0)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transaction History (Filtered to Expenses) */}
            <Card className="p-8 bg-white border border-gray-200 rounded-2xl lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Transaction History</h3>
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 text-sm font-bold text-gray-900 w-1/4 pl-4">Category</th>
                        <th className="text-left py-4 text-sm font-bold text-gray-900 w-1/6">Date</th>
                        <th className="text-left py-4 text-sm font-bold text-gray-900 w-1/3">Description</th>
                        <th className="text-right py-4 text-sm font-bold text-gray-900 w-1/6">Amount</th>
                        <th className="text-right py-4 text-sm font-bold text-gray-900 w-1/12 pr-4">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.type === 'expense').map((tx, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(tx.category)}`}>
                                {getCategoryIcon(tx.category)}
                              </div>
                              <span className="font-medium text-gray-600">{tx.category}</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600 font-medium">
                            {new Date(tx.date).toLocaleDateString('de-DE')}
                          </td>
                          <td className="py-4 text-gray-500">
                            {tx.description}
                          </td>
                          <td className="py-4 text-right font-medium text-gray-600">
                            -{tx.amount.toFixed(2)}
                          </td>
                          <td className="py-4 text-right text-gray-500 pr-4">
                            USD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === "Transaction History" && (
          <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Transaction History</h3>
            
            {loading ? (
               <div className="flex justify-center p-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 text-sm font-bold text-gray-900 w-1/4 pl-4">Category</th>
                      <th className="text-left py-4 text-sm font-bold text-gray-900 w-1/6">Date</th>
                      <th className="text-left py-4 text-sm font-bold text-gray-900 w-1/3">Description</th>
                      <th className="text-right py-4 text-sm font-bold text-gray-900 w-1/6">Amount</th>
                      <th className="text-right py-4 text-sm font-bold text-gray-900 w-1/12 pr-4">Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(tx.category)}`}>
                              {getCategoryIcon(tx.category)}
                            </div>
                            <span className="font-medium text-gray-600">{tx.category}</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600 font-medium">
                          {new Date(tx.date).toLocaleDateString('de-DE')}
                        </td>
                        <td className="py-4 text-gray-500">
                          {tx.description}
                        </td>
                        <td className="py-4 text-right font-medium text-gray-600">
                          {tx.type === 'expense' ? '-' : ''}{tx.amount.toFixed(2)}
                        </td>
                        <td className="py-4 text-right text-gray-500 pr-4">
                          USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === "Analytics" && (
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
        )}
      </div>
    </div>
  );
}
