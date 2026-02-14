"use client";

import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import BudgetTabContent from "@/components/BudgetTabContent";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { categoriesApi, Category } from "@/lib/categories-api";
import { getOrCreateBudget, Budget } from "@/lib/budgets-api";
import { 
  getBudgetLineItemsByBudget,
  createBudgetLineItem, 
  updateBudgetLineItem, 
  deleteBudgetLineItem,
} from "@/lib/budget-line-items-api";
import { authApi } from "@/lib/auth-api";
import QuickCategoryDialog from "@/components/QuickCategoryDialog";
import { useMonth } from "@/contexts/MonthContext";
import { BudgetLineItemFormValues } from "@/components/BudgetLineItemFormDialog";

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
  const { selectedMonth } = useMonth();

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

  // Add a new budget item from the modal form — saves immediately to backend
  const addItem = async (
    setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, 
    ownerSlot: 'user1' | 'user2' | 'shared',
    values: BudgetLineItemFormValues,
  ) => {
    if (!currentBudget) {
      console.error('No budget loaded');
      return;
    }

    // Optimistic local add with temp ID
    const tempId = `temp-${Date.now()}`;
    const newItem: BudgetItem = {
      id: tempId,
      name: values.name,
      category: values.category,
      amount: values.amount,
    };
    setter((prev) => [...prev, newItem]);

    // Immediately persist to backend
    try {
      const created = await createBudgetLineItem({
        budget_id: currentBudget.id,
        name: values.name,
        category_id: values.category,
        amount: values.amount,
        owner_slot: ownerSlot,
      });
      // Replace temp ID with real ID
      setter((prev) =>
        prev.map((i) => (i.id === tempId ? { ...i, id: created.id } : i))
      );
      createdItems.current.add(created.id);
    } catch (error) {
      console.error('Failed to create budget line item:', error);
      // Remove the optimistic item on error
      setter((prev) => prev.filter((i) => i.id !== tempId));
    }
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

  // Map active tab to category type for the quick-create dialog
  const tabToCategoryType = (tab: TabType): "income" | "expense" | "savings" | "fun" => {
    switch (tab) {
      case "income": return "income";
      case "shared-expenses": return "expense";
      case "personal-expenses": return "expense";
      case "shared-savings": return "savings";
      case "fun": return "fun";
    }
  };

  // Called when a new category is created via the quick dialog
  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    if (newCat.type === "income") setIncomeCategories((prev) => [...prev, newCat]);
    if (newCat.type === "expense") setExpenseCategories((prev) => [...prev, newCat]);
    if (newCat.type === "savings") setSavingsCategories((prev) => [...prev, newCat]);
    if (newCat.type === "fun") setFunCategories((prev) => [...prev, newCat]);
  };

  // Quick category button rendered in the left column of each tab
  const quickCategorySlot = (
    <QuickCategoryDialog
      defaultType={tabToCategoryType(activeTab)}
      onCategoryCreated={handleCategoryCreated}
    />
  );

  const tabs = [
    { id: "income" as TabType, label: "Income" },
    { id: "shared-expenses" as TabType, label: "Shared Expenses" },
    { id: "personal-expenses" as TabType, label: "Personal Expenses" },
    { id: "shared-savings" as TabType, label: "Shared Savings" },
    { id: "fun" as TabType, label: "Fun" },
  ];

  // Tabs slot — rendered inside BudgetTabContent's right column header
  const tabsSlot = (
    <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Budget" 
        subtitle="Plan and manage your monthly budget across all categories." 
        breadcrumb={["Dashboard", "Budget"]}
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

        {/* Tab Content */}
        <div>
            {/* Income Tab */}
            {activeTab === "income" && (
              <BudgetTabContent
                layout="double"
                leftHeaderSlot={quickCategorySlot}
                rightHeaderSlot={tabsSlot}
                columns={[
                  {
                    title: user1Name,
                    items: user1IncomeItems,
                    ownerSlot: "user1",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setUser1IncomeItems, "user1", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setUser1IncomeItems, id, field, value, "user1"),
                    onRemoveItem: (id: string) => removeItem(setUser1IncomeItems, id),
                    categories: incomeCategories,
                    namePlaceholder: "Name",
                    addButtonText: "Add Income",
                  },
                  {
                    title: user2Name,
                    items: user2IncomeItems,
                    ownerSlot: "user2",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setUser2IncomeItems, "user2", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setUser2IncomeItems, id, field, value, "user2"),
                    onRemoveItem: (id: string) => removeItem(setUser2IncomeItems, id),
                    categories: incomeCategories,
                    namePlaceholder: "Name",
                    addButtonText: "Add Income",
                  },
                ]}
              />
            )}

            {/* Shared Expenses Tab */}
            {activeTab === "shared-expenses" && (
              <BudgetTabContent
                description="Shared expenses split between both users"
                layout="single"
                leftHeaderSlot={quickCategorySlot}
                rightHeaderSlot={tabsSlot}
                columns={[
                  {
                    items: sharedExpenseItems,
                    ownerSlot: "shared",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setSharedExpenseItems, "shared", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setSharedExpenseItems, id, field, value, "shared"),
                    onRemoveItem: (id: string) => removeItem(setSharedExpenseItems, id),
                    categories: expenseCategories,
                    namePlaceholder: "Expense name",
                    addButtonText: "Add Shared Expense",
                  },
                ]}
              />
            )}

            {/* Personal Expenses Tab */}
            {activeTab === "personal-expenses" && (
              <BudgetTabContent
                layout="double"
                leftHeaderSlot={quickCategorySlot}
                rightHeaderSlot={tabsSlot}
                columns={[
                  {
                    title: user1Name,
                    items: user1PersonalExpenses,
                    ownerSlot: "user1",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setUser1PersonalExpenses, "user1", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setUser1PersonalExpenses, id, field, value, "user1"),
                    onRemoveItem: (id: string) => removeItem(setUser1PersonalExpenses, id),
                    categories: expenseCategories,
                    namePlaceholder: "Expense name",
                    addButtonText: "Add Expense",
                  },
                  {
                    title: user2Name,
                    items: user2PersonalExpenses,
                    ownerSlot: "user2",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setUser2PersonalExpenses, "user2", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setUser2PersonalExpenses, id, field, value, "user2"),
                    onRemoveItem: (id: string) => removeItem(setUser2PersonalExpenses, id),
                    categories: expenseCategories,
                    namePlaceholder: "Expense name",
                    addButtonText: "Add Expense",
                  },
                ]}
              />
            )}

            {/* Shared Savings Tab */}
            {activeTab === "shared-savings" && (
              <BudgetTabContent
                description="Savings goals shared between both users"
                layout="single"
                leftHeaderSlot={quickCategorySlot}
                rightHeaderSlot={tabsSlot}
                columns={[
                  {
                    items: sharedSavingsItems,
                    ownerSlot: "shared",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setSharedSavingsItems, "shared", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setSharedSavingsItems, id, field, value, "shared"),
                    onRemoveItem: (id: string) => removeItem(setSharedSavingsItems, id),
                    categories: savingsCategories,
                    namePlaceholder: "Savings goal name",
                    addButtonText: "Add Savings Item",
                  },
                ]}
              />
            )}

            {/* Fun Items Tab */}
            {activeTab === "fun" && (
              <BudgetTabContent
                description="Fun spending shared between both users"
                layout="single"
                leftHeaderSlot={quickCategorySlot}
                rightHeaderSlot={tabsSlot}
                columns={[
                  {
                    items: sharedFunItems,
                    ownerSlot: "shared",
                    onAddItem: (values: BudgetLineItemFormValues) =>
                      addItem(setSharedFunItems, "shared", values),
                    onUpdateItem: (id: string, field: "name" | "category" | "amount", value: string | number) =>
                      updateItem(setSharedFunItems, id, field, value, "shared"),
                    onRemoveItem: (id: string) => removeItem(setSharedFunItems, id),
                    categories: funCategories,
                    namePlaceholder: "Fun activity name",
                    addButtonText: "Add Fun Item",
                  },
                ]}
              />
            )}
          </div>
      </div>
    </div>
  );
}
