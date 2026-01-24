"use client";

import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import BudgetTabContent from "@/components/BudgetTabContent";
import { TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { categoriesApi, Category } from "@/lib/categories-api";
import { getOrCreateBudget, Budget } from "@/lib/budgets-api";
import { 
  getBudgetLineItems, 
  getBudgetLineItemsByBudget,
  createBudgetLineItem, 
  updateBudgetLineItem, 
  deleteBudgetLineItem,
  BudgetLineItem,
  BudgetLineItemWithCategory
} from "@/lib/budget-line-items-api";
import { authApi } from "@/lib/auth-api";

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

type TabType = "income" | "shared-expenses" | "personal-expenses" | "shared-savings" | "fun";

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
  const [user2Name, setUser2Name] = useState("User 2");

  // Backend data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [savingsCategories, setSavingsCategories] = useState<Category[]>([]);
  const [funCategories, setFunCategories] = useState<Category[]>([]);
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

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        if (profile.partner_name) {
          setUser2Name(profile.partner_name);
        }
        if (profile.full_name) {
          setUser1Name(profile.full_name);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    loadProfile();
  }, []);

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
        const savingsOnly = allCategories.filter(cat => cat.type === 'savings');
        const funOnly = allCategories.filter(cat => cat.type === 'fun');
        console.log('Income categories:', incomeOnly);
        console.log('Expense categories:', expenseOnly);
        console.log('Savings categories:', savingsOnly);
        console.log('Fun categories:', funOnly);
        setIncomeCategories(incomeOnly);
        setExpenseCategories(expenseOnly);
        setSavingsCategories(savingsOnly);
        setFunCategories(funOnly);
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

        // Load budget line items WITH category info
        console.log('Loading budget line items...');
        const lineItems = await getBudgetLineItemsByBudget(budget.id);
        console.log('Loaded line items with categories:', lineItems);
        
        // Track all loaded items as created
        lineItems.forEach(item => createdItems.current.add(item.id));
        
        // Separate line items by owner_slot AND category type
        const user1Income = lineItems.filter(item => 
          item.owner_slot === 'user1' && item.category?.type === 'income'
        );
        const user2Income = lineItems.filter(item => 
          item.owner_slot === 'user2' && item.category?.type === 'income'
        );
        const sharedExpenses = lineItems.filter(item => 
          item.owner_slot === 'shared' && item.category?.type === 'expense'
        );
        const user1PersonalExp = lineItems.filter(item => 
          item.owner_slot === 'user1' && item.category?.type === 'expense'
        );
        const user2PersonalExp = lineItems.filter(item => 
          item.owner_slot === 'user2' && item.category?.type === 'expense'
        );
        const sharedSavings = lineItems.filter(item => 
          item.owner_slot === 'shared' && item.category?.type === 'savings'
        );
        const sharedFun = lineItems.filter(item => 
          item.owner_slot === 'shared' && item.category?.type === 'fun'
        );

        console.log('User1 income items:', user1Income);
        console.log('User2 income items:', user2Income);
        console.log('Shared expense items:', sharedExpenses);
        console.log('User1 personal expenses:', user1PersonalExp);
        console.log('User2 personal expenses:', user2PersonalExp);
        console.log('Shared savings items:', sharedSavings);
        console.log('Shared fun items:', sharedFun);

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

        setUser1PersonalExpenses(user1PersonalExp.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          amount: item.amount
        })));

        setUser2PersonalExpenses(user2PersonalExp.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          amount: item.amount
        })));

        setSharedSavingsItems(sharedSavings.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          amount: item.amount
        })));

        setSharedFunItems(sharedFun.map(item => ({
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

  // Fun items (shared)
  const [sharedFunItems, setSharedFunItems] = useState<BudgetItem[]>([]);

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

  // Save handlers for each tab
  const saveSharedExpenses = async () => {
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
  };

  const savePersonalExpenses = async () => {
    if (!currentBudget) {
      alert('No budget loaded. Please wait for the page to load.');
      return;
    }
    console.log('=== SAVING PERSONAL EXPENSES ===');
    let savedCount = 0;
    let errorCount = 0;
    for (const item of [...user1PersonalExpenses, ...user2PersonalExpenses]) {
      try {
        const ownerSlot = user1PersonalExpenses.includes(item) ? 'user1' : 'user2';
        const setter = user1PersonalExpenses.includes(item) ? setUser1PersonalExpenses : setUser2PersonalExpenses;
        await saveItem(item, ownerSlot, setter);
        savedCount++;
      } catch (error) {
        console.error('Failed to save personal expense:', item, error);
        errorCount++;
      }
    }
    console.log(`=== SAVE COMPLETE: ${savedCount} saved, ${errorCount} errors ===`);
    if (errorCount > 0) {
      alert(`Personal expenses saved with ${errorCount} errors. Check console for details.`);
    } else {
      alert(`Personal expenses saved successfully! ${savedCount} items saved.`);
    }
  };

  const saveSharedSavings = async () => {
    console.log('=== SAVE SHARED SAVINGS CLICKED ===');
    let savedCount = 0;
    let errorCount = 0;
    for (const item of sharedSavingsItems) {
      try {
        await saveItem(item, 'shared', setSharedSavingsItems);
        savedCount++;
      } catch (error) {
        console.error('Failed to save shared savings:', item, error);
        errorCount++;
      }
    }
    console.log(`=== SAVE COMPLETE: ${savedCount} saved, ${errorCount} errors ===`);
    if (errorCount > 0) {
      alert(`Shared savings saved with ${errorCount} errors. Check console for details.`);
    } else {
      alert(`Shared savings saved successfully! ${savedCount} items saved.`);
    }
  };

  const saveFunItems = async () => {
    console.log('=== SAVE FUN ITEMS CLICKED ===');
    let savedCount = 0;
    let errorCount = 0;
    for (const item of sharedFunItems) {
      try {
        await saveItem(item, 'shared', setSharedFunItems);
        savedCount++;
      } catch (error) {
        console.error('Failed to save fun item:', item, error);
        errorCount++;
      }
    }
    console.log(`=== SAVE COMPLETE: ${savedCount} saved, ${errorCount} errors ===`);
    if (errorCount > 0) {
      alert(`Fun items saved with ${errorCount} errors. Check console for details.`);
    } else {
      alert(`Fun items saved successfully! ${savedCount} items saved.`);
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
  const sharedFunTotal = sharedFunItems.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalIncome - sharedExpensesTotal - personalExpensesTotal - sharedSavingsTotal - sharedFunTotal;

  const tabs = [
    { id: "income" as TabType, label: "Income" },
    { id: "shared-expenses" as TabType, label: "Shared Expenses" },
    { id: "personal-expenses" as TabType, label: "Personal Expenses" },
    { id: "shared-savings" as TabType, label: "Shared Savings" },
    { id: "fun" as TabType, label: "Fun" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
          <StatCard
            title="FUN SPENDING"
            value={`${sharedFunTotal.toLocaleString()} kr.`}
            subtitle="Last month"
            trend="neutral"
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
              <BudgetTabContent
                layout="double"
                columns={[
                  {
                    title: user1Name,
                    items: user1IncomeItems,
                    onAddItem: () => addItem(setUser1IncomeItems, "user1", ""),
                    onUpdateItem: (id, field, value) => 
                      updateItem(setUser1IncomeItems, id, field, value, "user1"),
                    onRemoveItem: (id) => removeItem(setUser1IncomeItems, id),
                    categories: incomeCategories,
                    namePlaceholder: "Name",
                    addButtonText: "Add Item",
                  },
                  {
                    title: user2Name,
                    items: user2IncomeItems,
                    onAddItem: () => addItem(setUser2IncomeItems, "user2", ""),
                    onUpdateItem: (id, field, value) => 
                      updateItem(setUser2IncomeItems, id, field, value, "user2"),
                    onRemoveItem: (id) => removeItem(setUser2IncomeItems, id),
                    categories: incomeCategories,
                    namePlaceholder: "Name",
                    addButtonText: "Add Item",
                  },
                ]}
                saveButtonText="Save Budget"
                onSave={saveBudget}
              />
            )}

            {/* Shared Expenses Tab */}
            {activeTab === "shared-expenses" && (
              <BudgetTabContent
                description="Shared expenses split between both users"
                layout="single"
                columns={[
                  {
                    items: sharedExpenseItems,
                    onAddItem: () => addItem(setSharedExpenseItems, "shared", ""),
                    onUpdateItem: (id, field, value) =>
                      updateItem(setSharedExpenseItems, id, field, value, "shared"),
                    onRemoveItem: (id) => removeItem(setSharedExpenseItems, id),
                    categories: expenseCategories,
                    namePlaceholder: "Expense name",
                    addButtonText: "Add Shared Expense",
                  },
                ]}
                saveButtonText="Save Shared Expenses"
                onSave={saveSharedExpenses}
              />
            )}

            {/* Personal Expenses Tab */}
            {activeTab === "personal-expenses" && (
              <BudgetTabContent
                layout="double"
                columns={[
                  {
                    title: user1Name,
                    items: user1PersonalExpenses,
                    onAddItem: () => addItem(setUser1PersonalExpenses, "user1", ""),
                    onUpdateItem: (id, field, value) =>
                      updateItem(setUser1PersonalExpenses, id, field, value, "user1"),
                    onRemoveItem: (id) => removeItem(setUser1PersonalExpenses, id),
                    categories: expenseCategories,
                    namePlaceholder: "Expense name",
                    addButtonText: "Add Item",
                  },
                  {
                    title: user2Name,
                    items: user2PersonalExpenses,
                    onAddItem: () => addItem(setUser2PersonalExpenses, "user2", ""),
                    onUpdateItem: (id, field, value) =>
                      updateItem(setUser2PersonalExpenses, id, field, value, "user2"),
                    onRemoveItem: (id) => removeItem(setUser2PersonalExpenses, id),
                    categories: expenseCategories,
                    namePlaceholder: "Expense name",
                    addButtonText: "Add Item",
                  },
                ]}
                saveButtonText="Save Personal Expenses"
                onSave={savePersonalExpenses}
              />
            )}

            {/* Shared Savings Tab */}
            {activeTab === "shared-savings" && (
              <BudgetTabContent
                description="Savings goals shared between both users"
                layout="single"
                columns={[
                  {
                    items: sharedSavingsItems,
                    onAddItem: () => addItem(setSharedSavingsItems, "shared", ""),
                    onUpdateItem: (id, field, value) =>
                      updateItem(setSharedSavingsItems, id, field, value, "shared"),
                    onRemoveItem: (id) => removeItem(setSharedSavingsItems, id),
                    categories: savingsCategories,
                    namePlaceholder: "Savings goal name",
                    addButtonText: "Add Savings Goal",
                  },
                ]}
                saveButtonText="Save Shared Savings"
                onSave={saveSharedSavings}
              />
            )}

            {/* Fun Tab */}
            {activeTab === "fun" && (
              <BudgetTabContent
                description="Fun spending shared between both users"
                layout="single"
                columns={[
                  {
                    items: sharedFunItems,
                    onAddItem: () => addItem(setSharedFunItems, "shared", ""),
                    onUpdateItem: (id, field, value) =>
                      updateItem(setSharedFunItems, id, field, value, "shared"),
                    onRemoveItem: (id) => removeItem(setSharedFunItems, id),
                    categories: funCategories,
                    namePlaceholder: "Fun activity name",
                    addButtonText: "Add Fun Activity",
                  },
                ]}
                saveButtonText="Save Fun Items"
                onSave={saveFunItems}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
