"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface BudgetItem {
  id: string;
  name: string;
  category: string;
  amount: number;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

type TabType = "income" | "shared-expenses" | "personal-expenses" | "shared-savings" | "personal";

function StatCard({ title, value, subtitle, trend }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Card className="p-6 bg-white">
      <div className="space-y-2">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            {getTrendIcon()}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState("januar 2026");
  const [activeTab, setActiveTab] = useState<TabType>("income");
  const [user1Name, setUser1Name] = useState("Simon Lund");
  const [user2Name, setUser2Name] = useState("Aya Laurvigen");

  // User 1 Income items
  const [user1IncomeItems, setUser1IncomeItems] = useState<BudgetItem[]>([
    { id: "1", name: "Neuralogics", category: "Salary", amount: 13837 },
    { id: "2", name: "SU", category: "Income", amount: 4382 },
    { id: "3", name: "SU lån", category: "Income", amount: 3799 },
  ]);

  // User 2 Income items
  const [user2IncomeItems, setUser2IncomeItems] = useState<BudgetItem[]>([]);

  // Shared Expenses
  const [sharedExpenseItems, setSharedExpenseItems] = useState<BudgetItem[]>([]);

  // Personal Expenses (User 1 & User 2)
  const [user1PersonalExpenses, setUser1PersonalExpenses] = useState<BudgetItem[]>([]);
  const [user2PersonalExpenses, setUser2PersonalExpenses] = useState<BudgetItem[]>([]);

  // Shared Savings
  const [sharedSavingsItems, setSharedSavingsItems] = useState<BudgetItem[]>([]);

  // Personal Savings
  const [user1PersonalItems, setUser1PersonalItems] = useState<BudgetItem[]>([]);
  const [user2PersonalItems, setUser2PersonalItems] = useState<BudgetItem[]>([]);

  // Generic functions for managing items
  const addItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, category: string = "") => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: "",
      category: category,
      amount: 0,
    };
    setter((prev) => [...prev, newItem]);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
    id: string,
    field: keyof BudgetItem,
    value: any
  ) => {
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculate totals
  const totalIncome = 
    user1IncomeItems.reduce((sum, item) => sum + item.amount, 0) +
    user2IncomeItems.reduce((sum, item) => sum + item.amount, 0);
  
  const sharedExpensesTotal = sharedExpenseItems.reduce((sum, item) => sum + item.amount, 0);
  const personalExpensesTotal = 
    user1PersonalExpenses.reduce((sum, item) => sum + item.amount, 0) +
    user2PersonalExpenses.reduce((sum, item) => sum + item.amount, 0);
  const sharedSavingsTotal = sharedSavingsItems.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalIncome - sharedExpensesTotal - personalExpensesTotal - sharedSavingsTotal;

  const tabs = [
    { id: "income" as TabType, label: "Income" },
    { id: "shared-expenses" as TabType, label: "Shared Expenses" },
    { id: "personal-expenses" as TabType, label: "Personal Expenses" },
    { id: "shared-savings" as TabType, label: "Shared Savings" },
    { id: "personal" as TabType, label: "Fun" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome Simon Lund</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="januar 2026">januar 2026</option>
              <option value="december 2025">december 2025</option>
              <option value="november 2025">november 2025</option>
            </select>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Budget</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="TOTAL INCOME"
            value={`${totalIncome.toLocaleString()} kr.`}
            subtitle="Last month"
            trend="up"
          />
          <StatCard
            title="SHARED EXPENSES"
            value={`${sharedExpensesTotal.toLocaleString()} kr.`}
            subtitle="Last month"
            trend="down"
          />
          <StatCard
            title="PERSONAL EXPENSES"
            value={`${personalExpensesTotal.toLocaleString()} kr.`}
            subtitle="Last month"
            trend="down"
          />
          <StatCard
            title="REMAINING"
            value={`${remaining.toLocaleString()} kr.`}
            subtitle="Last month"
            trend="up"
          />
          <StatCard
            title="SHARED SAVINGS"
            value={`${sharedSavingsTotal.toLocaleString()} kr.`}
            subtitle="Last month"
            trend="up"
          />
        </div>

        {/* Budget Form with Tabs */}
        <Card className="p-0 bg-white overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Income Tab */}
            {activeTab === "income" && (
              <div className="grid grid-cols-2 gap-8">
                {/* User 1 Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={user1Name}
                      onChange={(e) => setUser1Name(e.target.value)}
                      className="text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-indigo-500 px-2 py-1"
                    />
                  </div>

                  {user1IncomeItems.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(setUser1IncomeItems, item.id, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItem(setUser1IncomeItems, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(setUser1IncomeItems, item.id, "category", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Salary">Salary</option>
                          <option value="Income">Income</option>
                          <option value="Bonus">Bonus</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser1IncomeItems, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(setUser1IncomeItems, "Income")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {/* User 2 Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={user2Name}
                      onChange={(e) => setUser2Name(e.target.value)}
                      className="text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-indigo-500 px-2 py-1"
                    />
                  </div>

                  {user2IncomeItems.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(setUser2IncomeItems, item.id, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItem(setUser2IncomeItems, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(setUser2IncomeItems, item.id, "category", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Salary">Salary</option>
                          <option value="Income">Income</option>
                          <option value="Bonus">Bonus</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser2IncomeItems, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(setUser2IncomeItems, "Income")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* Shared Expenses Tab */}
            {activeTab === "shared-expenses" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">Shared expenses split between both users</p>
                {sharedExpenseItems.map((item) => (
                  <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(setSharedExpenseItems, item.id, "name", e.target.value)
                        }
                        placeholder="Expense name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeItem(setSharedExpenseItems, item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(setSharedExpenseItems, item.id, "category", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Category</option>
                        <option value="Rent">Rent</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(setSharedExpenseItems, item.id, "amount", parseFloat(e.target.value) || 0)
                        }
                        placeholder="Amount"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addItem(setSharedExpenseItems)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Shared Expense
                </button>
              </div>
            )}

            {/* Personal Expenses Tab */}
            {activeTab === "personal-expenses" && (
              <div className="grid grid-cols-2 gap-8">
                {/* User 1 Personal Expenses */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">{user1Name}</h4>
                  {user1PersonalExpenses.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(setUser1PersonalExpenses, item.id, "name", e.target.value)
                          }
                          placeholder="Expense name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItem(setUser1PersonalExpenses, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(setUser1PersonalExpenses, item.id, "category", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Food">Food</option>
                          <option value="Transport">Transport</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser1PersonalExpenses, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(setUser1PersonalExpenses)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {/* User 2 Personal Expenses */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">{user2Name}</h4>
                  {user2PersonalExpenses.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(setUser2PersonalExpenses, item.id, "name", e.target.value)
                          }
                          placeholder="Expense name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItem(setUser2PersonalExpenses, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(setUser2PersonalExpenses, item.id, "category", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Food">Food</option>
                          <option value="Transport">Transport</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser2PersonalExpenses, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(setUser2PersonalExpenses)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* Shared Savings Tab */}
            {activeTab === "shared-savings" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">Savings goals shared between both users</p>
                {sharedSavingsItems.map((item) => (
                  <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(setSharedSavingsItems, item.id, "name", e.target.value)
                        }
                        placeholder="Savings goal name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeItem(setSharedSavingsItems, item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(setSharedSavingsItems, item.id, "category", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Category</option>
                        <option value="Emergency Fund">Emergency Fund</option>
                        <option value="Vacation">Vacation</option>
                        <option value="Investment">Investment</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(setSharedSavingsItems, item.id, "amount", parseFloat(e.target.value) || 0)
                        }
                        placeholder="Amount"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addItem(setSharedSavingsItems)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Savings Goal
                </button>
              </div>
            )}

            {/* Personal Tab */}
            {activeTab === "personal" && (
              <div className="grid grid-cols-2 gap-8">
                {/* User 1 Personal */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">{user1Name}</h4>
                  {user1PersonalItems.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(setUser1PersonalItems, item.id, "name", e.target.value)
                          }
                          placeholder="Item name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItem(setUser1PersonalItems, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(setUser1PersonalItems, item.id, "category", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Savings">Savings</option>
                          <option value="Investment">Investment</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser1PersonalItems, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(setUser1PersonalItems)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {/* User 2 Personal */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">{user2Name}</h4>
                  {user2PersonalItems.map((item) => (
                    <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(setUser2PersonalItems, item.id, "name", e.target.value)
                          }
                          placeholder="Item name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItem(setUser2PersonalItems, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(setUser2PersonalItems, item.id, "category", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Savings">Savings</option>
                          <option value="Investment">Investment</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser2PersonalItems, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(setUser2PersonalItems)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
