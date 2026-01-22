"use client";

import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { categoriesApi, Category } from "@/lib/categories-api";
import { getOrCreateBudget, Budget } from "@/lib/budgets-api";
import { 
  getBudgetLineItems, 
  createBudgetLineItem, 
  updateBudgetLineItem, 
  deleteBudgetLineItem,
  BudgetLineItem 
} from "@/lib/budget-line-items-api";

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
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<TabType>("income");
  const [user1Name, setUser1Name] = useState("Simon Lund");
  const [user2Name, setUser2Name] = useState("Aya Laurvigen");

  // Backend data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // User 1 Income items
  const [user1IncomeItems, setUser1IncomeItems] = useState<BudgetItem[]>([]);

  // User 2 Income items
  const [user2IncomeItems, setUser2IncomeItems] = useState<BudgetItem[]>([]);

  // Refs for debouncing saves
  const saveTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const savingItems = useRef<Set<string>>(new Set());
  const createdItems = useRef<Set<string>>(new Set()); // Track items already created in backend

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories...');
        const allCategories = await categoriesApi.getAll();
        console.log('Loaded categories:', allCategories);
        setCategories(allCategories);
        const incomeOnly = allCategories.filter(cat => cat.type === 'income');
        const expenseOnly = allCategories.filter(cat => cat.type === 'expense');
        console.log('Income categories:', incomeOnly);
        console.log('Expense categories:', expenseOnly);
        setIncomeCategories(incomeOnly);
        setExpenseCategories(expenseOnly);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load budget and line items when month changes
  useEffect(() => {
    const loadBudgetData = async () => {
      if (!selectedMonth) return;
      
      console.log('Loading budget data for month:', selectedMonth);
      setIsLoading(true);
      try {
        // Clear created items tracking when loading new data
        createdItems.current.clear();
        
        // Get or create budget for the month
        console.log('Getting or creating budget...');
        const budget = await getOrCreateBudget(selectedMonth);
        console.log('Budget loaded:', budget);
        setCurrentBudget(budget);

        // Load budget line items
        console.log('Loading budget line items...');
        const lineItems = await getBudgetLineItems(budget.id);
        console.log('Loaded line items:', lineItems);
        
        // Track all loaded items as created
        lineItems.forEach(item => createdItems.current.add(item.id));
        
        // Separate line items by owner_slot and category type
        const user1Income = lineItems.filter(item => item.owner_slot === 'user1');
        const user2Income = lineItems.filter(item => item.owner_slot === 'user2');
        const sharedExpenses = lineItems.filter(item => item.owner_slot === 'shared');

        console.log('User1 income items:', user1Income);
        console.log('User2 income items:', user2Income);
        console.log('Shared expense items:', sharedExpenses);

        // Convert BudgetLineItem to BudgetItem format
        setUser1IncomeItems(user1Income.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          amount: item.amount
        })));

        setUser2IncomeItems(user2Income.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          amount: item.amount
        })));

        setSharedExpenseItems(sharedExpenses.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          amount: item.amount
        })));
      } catch (error) {
        console.error('Failed to load budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgetData();
  }, [selectedMonth]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all pending save timeouts
      saveTimeouts.current.forEach(timeout => clearTimeout(timeout));
      saveTimeouts.current.clear();
    };
  }, []);


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

  // Generic functions for managing items with backend persistence
  const addItem = async (
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, 
    ownerSlot: 'user1' | 'user2' | 'shared',
    category: string = ""
  ) => {
    if (!currentBudget) {
      console.error('No budget loaded');
      return;
    }

    const newItem: BudgetItem = {
      id: `temp-${Date.now()}`, // Temporary ID until saved to backend
      name: "",
      category: category,
      amount: 0,
    };
    setter((prev) => [...prev, newItem]);
  };

  const saveItem = async (
    item: BudgetItem,
    ownerSlot: 'user1' | 'user2' | 'shared',
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>
  ) => {
    if (!currentBudget) {
      console.log('No budget loaded, cannot save');
      return;
    }

    // For new items (temp ID), require all fields to be filled
    if (item.id.startsWith('temp-')) {
      if (!item.name || !item.category || item.amount <= 0) {
        console.log('Incomplete new item, waiting for all fields:', item);
        return; // Don't save incomplete new items
      }
    } else {
      // For existing items, just need at least one field
      if (!item.name && !item.category && !item.amount) {
        console.log('Nothing to update');
        return;
      }
    }

    // Prevent duplicate saves for the same item
    if (savingItems.current.has(item.id)) {
      console.log('Save already in progress for', item.id);
      return;
    }

    savingItems.current.add(item.id);

    try {
      // If item has temp ID, create new item in backend
      if (item.id.startsWith('temp-')) {
        // Check if this temp item was already created
        if (createdItems.current.has(item.id)) {
          console.log('Item already created, skipping:', item.id);
          savingItems.current.delete(item.id);
          return;
        }

        console.log('Creating new budget line item:', item);
        const created = await createBudgetLineItem({
          budget_id: currentBudget.id,
          name: item.name,
          category_id: item.category,
          amount: item.amount,
          owner_slot: ownerSlot
        });

        console.log('Created budget line item with ID:', created.id);
        
        // Mark this temp item as created
        createdItems.current.add(item.id);
        
        // Update the item with the real ID from backend
        setter(prev => prev.map(i => 
          i.id === item.id ? { ...i, id: created.id } : i
        ));
        
        // Remove temp ID from created set and add real ID
        createdItems.current.delete(item.id);
        createdItems.current.add(created.id);
      } else {
        // Update existing item (already has real backend ID)
        console.log('Updating existing budget line item:', item.id);
        await updateBudgetLineItem(item.id, {
          name: item.name,
          category_id: item.category,
          amount: item.amount,
          owner_slot: ownerSlot
        });
      }
    } catch (error) {
      console.error('Failed to save budget line item:', error);
      // Remove from created set on error so it can be retried
      if (item.id.startsWith('temp-')) {
        createdItems.current.delete(item.id);
      }
    } finally {
      savingItems.current.delete(item.id);
    }
  };

  const removeItem = async (
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, 
    id: string
  ) => {
    try {
      // Only call API if it's not a temp ID
      if (!id.startsWith('temp-')) {
        await deleteBudgetLineItem(id);
      }
      setter((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete budget line item:', error);
    }
  };

  const updateItem = async (
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
    id: string,
    field: keyof BudgetItem,
    value: any,
    ownerSlot: 'user1' | 'user2' | 'shared'
  ) => {
    console.log(`Updating item ${id}, field: ${field}, value:`, value);
    
    // Clear any existing timeout for this item
    const existingTimeout = saveTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      console.log(`Cleared existing timeout for ${id}`);
    }

    // Capture the updated item in a ref to avoid closure issues
    const itemToSaveRef = { current: null as BudgetItem | null };
    
    // Update local state immediately for responsive UI
    setter((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const updated: BudgetItem = { ...item, [field]: value };
          itemToSaveRef.current = updated; // Capture the updated item
          console.log('Updated item:', updated);
          return updated;
        }
        return item;
      });
    });

    // Debounce the save to backend
    const itemToSave = itemToSaveRef.current;
    if (itemToSave) {
      console.log(`Setting timeout to save item ${id} in 800ms`, itemToSave);
      
      const timeout = setTimeout(() => {
        console.log(`Timeout fired, calling saveItem for ${id}`, itemToSave);
        saveItem(itemToSave, ownerSlot, setter);
        saveTimeouts.current.delete(id);
      }, 800);
      
      saveTimeouts.current.set(id, timeout);
    } else {
      console.log('No updated item found for', id);
    }
  };

  // Simple local-only functions for non-income tabs
  const addItemLocal = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, category: string = "") => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: "",
      category: category,
      amount: 0,
    };
    setter((prev) => [...prev, newItem]);
  };

  const removeItemLocal = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemLocal = (
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
    id: string,
    field: keyof BudgetItem,
    value: any
  ) => {
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Manual save function for Save Budget button
  const saveBudget = async () => {
    if (!currentBudget) {
      alert('No budget loaded. Please wait for the page to load.');
      return;
    }

    console.log('=== MANUAL SAVE TRIGGERED ===');
    console.log('User 1 income items:', user1IncomeItems);
    console.log('User 2 income items:', user2IncomeItems);

    let savedCount = 0;
    let errorCount = 0;

    // Save all User 1 income items
    for (const item of user1IncomeItems) {
      try {
        await saveItem(item, 'user1', setUser1IncomeItems);
        savedCount++;
      } catch (error) {
        console.error('Failed to save user1 item:', item, error);
        errorCount++;
      }
    }

    // Save all User 2 income items
    for (const item of user2IncomeItems) {
      try {
        await saveItem(item, 'user2', setUser2IncomeItems);
        savedCount++;
      } catch (error) {
        console.error('Failed to save user2 item:', item, error);
        errorCount++;
      }
    }

    console.log(`=== SAVE COMPLETE: ${savedCount} saved, ${errorCount} errors ===`);
    
    if (errorCount > 0) {
      alert(`Budget saved with ${errorCount} errors. Check console for details.`);
    } else {
      alert(`Budget saved successfully! ${savedCount} items saved.`);
    }
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
      <Header 
        title="Budget" 
        subtitle="Welcome Simon Lund" 
        breadcrumb={["Dashboard", "Budget"]}
        action={
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        }
      />

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
                            updateItem(setUser1IncomeItems, item.id, "name", e.target.value, "user1")
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
                            updateItem(setUser1IncomeItems, item.id, "category", e.target.value, "user1")
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          {incomeCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser1IncomeItems, item.id, "amount", parseFloat(e.target.value) || 0, "user1")
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(setUser1IncomeItems, "user1", "")}
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
                            updateItem(setUser2IncomeItems, item.id, "name", e.target.value, "user2")
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
                            updateItem(setUser2IncomeItems, item.id, "category", e.target.value, "user2")
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Category</option>
                          {incomeCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(setUser2IncomeItems, item.id, "amount", parseFloat(e.target.value) || 0, "user2")
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(setUser2IncomeItems, "user2", "")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* Save Budget Button for Income Tab */}
            {activeTab === "income" && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={saveBudget}
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  Save Budget
                </button>
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
                          updateItem(setSharedExpenseItems, item.id, "name", e.target.value, "shared")
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
                          updateItem(setSharedExpenseItems, item.id, "category", e.target.value, "shared")
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Category</option>
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(setSharedExpenseItems, item.id, "amount", parseFloat(e.target.value) || 0, "shared")
                        }
                        placeholder="Amount"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addItem(setSharedExpenseItems, "shared", "")}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Shared Expense
                </button>
              </div>
            )}

            {/* Save Budget Button for Shared Expenses Tab */}
            {activeTab === "shared-expenses" && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={async () => {
                    if (!currentBudget) {
                      alert('No budget loaded. Please wait for the page to load.');
                      return;
                    }
                    console.log('=== SAVING SHARED EXPENSES ===');
                    let savedCount = 0;
                    let errorCount = 0;
                    for (const item of sharedExpenseItems) {
                      try {
                        await saveItem(item, 'shared', setSharedExpenseItems);
                        savedCount++;
                      } catch (error) {
                        console.error('Failed to save shared expense:', item, error);
                        errorCount++;
                      }
                    }
                    console.log(`=== SAVE COMPLETE: ${savedCount} saved, ${errorCount} errors ===`);
                    if (errorCount > 0) {
                      alert(`Shared expenses saved with ${errorCount} errors. Check console for details.`);
                    } else {
                      alert(`Shared expenses saved successfully! ${savedCount} items saved.`);
                    }
                  }}
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  Save Shared Expenses
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
                            updateItemLocal(setUser1PersonalExpenses, item.id, "name", e.target.value)
                          }
                          placeholder="Expense name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItemLocal(setUser1PersonalExpenses, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItemLocal(setUser1PersonalExpenses, item.id, "category", e.target.value)
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
                            updateItemLocal(setUser1PersonalExpenses, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItemLocal(setUser1PersonalExpenses)}
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
                            updateItemLocal(setUser2PersonalExpenses, item.id, "name", e.target.value)
                          }
                          placeholder="Expense name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItemLocal(setUser2PersonalExpenses, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItemLocal(setUser2PersonalExpenses, item.id, "category", e.target.value)
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
                            updateItemLocal(setUser2PersonalExpenses, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItemLocal(setUser2PersonalExpenses)}
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
                          updateItemLocal(setSharedSavingsItems, item.id, "name", e.target.value)
                        }
                        placeholder="Savings goal name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeItemLocal(setSharedSavingsItems, item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItemLocal(setSharedSavingsItems, item.id, "category", e.target.value)
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
                          updateItemLocal(setSharedSavingsItems, item.id, "amount", parseFloat(e.target.value) || 0)
                        }
                        placeholder="Amount"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addItemLocal(setSharedSavingsItems)}
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
                            updateItemLocal(setUser1PersonalItems, item.id, "name", e.target.value)
                          }
                          placeholder="Item name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItemLocal(setUser1PersonalItems, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItemLocal(setUser1PersonalItems, item.id, "category", e.target.value)
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
                            updateItemLocal(setUser1PersonalItems, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItemLocal(setUser1PersonalItems)}
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
                            updateItemLocal(setUser2PersonalItems, item.id, "name", e.target.value)
                          }
                          placeholder="Item name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => removeItemLocal(setUser2PersonalItems, item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItemLocal(setUser2PersonalItems, item.id, "category", e.target.value)
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
                            updateItemLocal(setUser2PersonalItems, item.id, "amount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItemLocal(setUser2PersonalItems)}
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
