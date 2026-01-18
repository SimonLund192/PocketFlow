"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { api, BudgetItem as ApiBudgetItem, Category } from "@/lib/api";

interface BudgetItem {
  id: string;
  name: string;
  category: string;
  value: string;
  user?: string;
}

interface MonthData {
  incomeUser1: BudgetItem[];
  incomeUser2: BudgetItem[];
  sharedExpenses: BudgetItem[];
  personalUser1: BudgetItem[];
  personalUser2: BudgetItem[];
  sharedSavings: BudgetItem[];
  personalSavingsUser1: BudgetItem[];
  personalSavingsUser2: BudgetItem[];
}

export default function BudgetPage() {
  // Next.js requires `useSearchParams()` to be used within a Suspense boundary.
  // We keep the existing Budget page logic by rendering a Suspense-wrapped body.
  return (
    <Suspense fallback={<BudgetPageFallback />}>
      <BudgetPageBody />
    </Suspense>
  );
}

function BudgetPageFallback() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Budget</h1>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

function BudgetPageBody() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("income");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get user display names
  const user1Name = user?.full_name || "User 1";
  const [user2Name, setUser2Name] = useState("User 2");

  // Handle clicking on User 2 name - navigate to settings
  const handleUser2NameClick = () => {
    router.push('/settings?tab=account');
    // Scroll to the input after navigation
    setTimeout(() => {
      const nameInput = document.querySelector('input[placeholder*="Partner"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
    }, 300);
  };
  
  // Load user 2 name from localStorage
  useEffect(() => {
    const savedUser2Name = localStorage.getItem("user2_name");
    if (savedUser2Name) {
      setUser2Name(savedUser2Name);
    }

    // Listen for changes from settings page
    const handleUser2NameChange = (event: CustomEvent) => {
      setUser2Name(event.detail);
    };

    window.addEventListener('user2NameChanged', handleUser2NameChange as EventListener);
    
    return () => {
      window.removeEventListener('user2NameChanged', handleUser2NameChange as EventListener);
    };
  }, []);
  
  // Generate list of months (current month + 11 future months)
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
    }
    return months;
  };

  const months = generateMonths();

  // Initialize with current month
  useEffect(() => {
    if (!selectedMonth && months.length > 0) {
      setSelectedMonth(months[0].key);
    }
  }, []);

  // Initialize active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "income") {
      router.push("/budget", { scroll: false });
      return;
    }
    router.push(`/budget?tab=${value}`, { scroll: false });
  };
  
  // Income items - two columns for users
  const [incomeUser1, setIncomeUser1] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "", user: user1Name }]);
  const [incomeUser2, setIncomeUser2] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "", user: "User 2" }]);
  
  // Shared Expenses - single column
  const [sharedExpenses, setSharedExpenses] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "" }]);
  
  // Personal Expenses - two columns for users
  const [personalUser1, setPersonalUser1] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "", user: user1Name }]);
  const [personalUser2, setPersonalUser2] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "", user: "User 2" }]);
  
  // Shared Savings - single column
  const [sharedSavings, setSharedSavings] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "" }]);
  
  // Personal Savings - two columns for users
  const [personalSavingsUser1, setPersonalSavingsUser1] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "", user: user1Name }]);
  const [personalSavingsUser2, setPersonalSavingsUser2] = useState<BudgetItem[]>([{ id: "1", name: "", category: "", value: "", user: "User 2" }]);

  // Categories loaded from database
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [savingsCategories, setSavingsCategories] = useState<string[]>([]);

  // Load categories from database
  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated]);

  const loadCategories = async () => {
    try {
      const categories = await api.getCategories();
      const income = categories.filter(cat => cat.type === 'income').map(cat => cat.name);
      const expense = categories.filter(cat => cat.type === 'expense').map(cat => cat.name);
      const savings = categories.filter(cat => cat.type === 'savings').map(cat => cat.name);
      
      setIncomeCategories(income);
      setExpenseCategories(expense);
      setSavingsCategories(savings);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Set default categories as fallback
      setIncomeCategories(["Salary", "Freelance", "Investment", "Business", "Other"]);
      setExpenseCategories(["Housing", "Food", "Transportation", "Utilities", "Healthcare", "Entertainment", "Shopping", "Education", "Other"]);
      setSavingsCategories(["Emergency Fund", "Retirement", "Investment", "Travel", "Education", "House", "Other"]);
    }
  };

  // Load budget data from API when month changes
  useEffect(() => {
    if (selectedMonth) {
      loadBudgetData(selectedMonth);
    }
  }, [selectedMonth]);

  const loadBudgetData = async (month: string) => {
    setIsLoading(true);
    try {
      const budget = await api.getBudget(month);
      
      // Convert API BudgetItem[] to local BudgetItem[] format
      const convertItems = (items: ApiBudgetItem[]): BudgetItem[] => {
        if (!items || items.length === 0) {
          return [{ id: "1", name: "", category: "", value: "", user: undefined }];
        }
        return items.map(item => ({
          id: item.id,
          name: item.name || "",
          category: item.category || "",
          value: item.value.toString(),
          user: item.user
        }));
      };

      setIncomeUser1(convertItems(budget.income_user1));
      setIncomeUser2(convertItems(budget.income_user2));
      setSharedExpenses(convertItems(budget.shared_expenses));
      setPersonalUser1(convertItems(budget.personal_user1));
      setPersonalUser2(convertItems(budget.personal_user2));
      setSharedSavings(convertItems(budget.shared_savings));
      setPersonalSavingsUser1(convertItems(budget.personal_savings_user1));
      setPersonalSavingsUser2(convertItems(budget.personal_savings_user2));
    } catch (error) {
      console.error('Failed to load budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save budget data to API with debounce
  useEffect(() => {
    if (!selectedMonth) return;
    
    const timeoutId = setTimeout(() => {
      saveBudgetData();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [selectedMonth, incomeUser1, incomeUser2, sharedExpenses, personalUser1, personalUser2, sharedSavings, personalSavingsUser1, personalSavingsUser2]);

  const saveBudgetData = async () => {
    if (!selectedMonth || isLoading) return;
    
    setIsSaving(true);
    try {
      // Convert local BudgetItem[] to API BudgetItem[] format
      const convertItems = (items: BudgetItem[]): ApiBudgetItem[] => {
        return items
          .filter(item => item.value !== "") // Only include items with values
          .map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            value: parseFloat(item.value) || 0,
            ...(item.user && { user: item.user }) // Only include user if it exists
          }));
      };

      const budgetData = {
        income_user1: convertItems(incomeUser1),
        income_user2: convertItems(incomeUser2),
        shared_expenses: convertItems(sharedExpenses),
        personal_user1: convertItems(personalUser1),
        personal_user2: convertItems(personalUser2),
        shared_savings: convertItems(sharedSavings),
        personal_savings_user1: convertItems(personalSavingsUser1),
        personal_savings_user2: convertItems(personalSavingsUser2),
      };

      await api.saveBudget(selectedMonth, budgetData);
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate KPIs
  const calculateTotal = (items: BudgetItem[]) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
  };

  const totalIncome = calculateTotal([...incomeUser1, ...incomeUser2]);
  const totalSharedExpenses = calculateTotal(sharedExpenses);
  const totalPersonalExpenses = calculateTotal([...personalUser1, ...personalUser2]);
  const totalSharedSavings = calculateTotal(sharedSavings);
  const remaining = totalIncome - totalSharedExpenses - totalPersonalExpenses - totalSharedSavings;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Helper functions for managing items
  const addItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, user?: string) => {
    setter(prev => [...prev, { id: Date.now().toString(), name: "", category: "", value: "", user }]);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string, value: string) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, value } : item));
  };

  const updateItemName = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string, name: string) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, name } : item));
  };

  const updateItemCategory = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string, category: string) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, category } : item));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Budget</h2>
          <p className="text-gray-500">Please login or create an account to manage your budget.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Budget</span>
        </div>

        {/* Month Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">
              {months.find(m => m.key === selectedMonth)?.label || 'Select Month'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showMonthDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {months.map((month) => (
                <button
                  key={month.key}
                  onClick={() => {
                    setSelectedMonth(month.key);
                    setShowMonthDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                    selectedMonth === month.key ? 'bg-blue-50 text-blue-600 font-medium' : ''
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          change=""
          changePercent=""
          isPositive={true}
        />
        <StatCard
          title="Shared Expenses"
          value={formatCurrency(totalSharedExpenses)}
          change=""
          changePercent=""
          isPositive={false}
        />
        <StatCard
          title="Personal Expenses"
          value={formatCurrency(totalPersonalExpenses)}
          change=""
          changePercent=""
          isPositive={false}
        />
        <StatCard
          title="Remaining"
          value={formatCurrency(remaining)}
          change=""
          changePercent=""
          isPositive={remaining >= 0}
        />
        <StatCard
          title="Shared Savings"
          value={formatCurrency(totalSharedSavings)}
          change=""
          changePercent=""
          isPositive={true}
        />
      </div>

      {/* Tabs */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="shared-expenses">Shared Expenses</TabsTrigger>
            <TabsTrigger value="personal-expenses">Personal Expenses</TabsTrigger>
            <TabsTrigger value="shared-savings">Shared Savings</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">{user1Name}</h3>
                <div className="space-y-2">
                  {incomeUser1.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemName(setIncomeUser1, item.id, e.target.value)}
                          placeholder="Name (e.g., Monthly Salary)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateItemCategory(setIncomeUser1, item.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Category</option>
                            {incomeCategories.length === 0 ? (
                              <option value="" disabled>No categories - Create in Settings</option>
                            ) : (
                              incomeCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateItem(setIncomeUser1, item.id, e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {incomeUser1.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setIncomeUser1, item.id)}
                          className="self-start mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setIncomeUser1, user1Name)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div>
                <h3 
                  className="text-sm font-medium mb-3 cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  onClick={handleUser2NameClick}
                  title="Click to change name"
                >
                  {user2Name}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h3>
                <div className="space-y-2">
                  {incomeUser2.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemName(setIncomeUser2, item.id, e.target.value)}
                          placeholder="Name (e.g., Freelance Work)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateItemCategory(setIncomeUser2, item.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Category</option>
                            {incomeCategories.length === 0 ? (
                              <option value="" disabled>No categories - Create in Settings</option>
                            ) : (
                              incomeCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateItem(setIncomeUser2, item.id, e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {incomeUser2.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setIncomeUser2, item.id)}
                          className="self-start mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setIncomeUser2, "User 2")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Shared Expenses Tab */}
          <TabsContent value="shared-expenses" className="space-y-4">
            <div className="space-y-2">
              {sharedExpenses.map(item => (
                <div key={item.id} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItemName(setSharedExpenses, item.id, e.target.value)}
                      placeholder="Name (e.g., Rent, Utilities)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={item.category}
                        onChange={(e) => updateItemCategory(setSharedExpenses, item.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select Category</option>
                        {expenseCategories.length === 0 ? (
                          <option value="" disabled>No categories - Create in Settings</option>
                        ) : (
                          expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        )}
                      </select>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setSharedExpenses, item.id, e.target.value)}
                        placeholder="Amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {sharedExpenses.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setSharedExpenses, item.id)}
                      className="self-start mt-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addItem(setSharedExpenses)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </TabsContent>

          {/* Personal Expenses Tab */}
          <TabsContent value="personal-expenses" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">{user1Name}</h3>
                <div className="space-y-2">
                  {personalUser1.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemName(setPersonalUser1, item.id, e.target.value)}
                          placeholder="Name (e.g., Gym Membership)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateItemCategory(setPersonalUser1, item.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Category</option>
                            {expenseCategories.length === 0 ? (
                              <option value="" disabled>No categories - Create in Settings</option>
                            ) : (
                              expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateItem(setPersonalUser1, item.id, e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {personalUser1.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalUser1, item.id)}
                          className="self-start mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setPersonalUser1, user1Name)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div>
                <h3 
                  className="text-sm font-medium mb-3 cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  onClick={handleUser2NameClick}
                  title="Click to change name"
                >
                  {user2Name}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h3>
                <div className="space-y-2">
                  {personalUser2.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemName(setPersonalUser2, item.id, e.target.value)}
                          placeholder="Name (e.g., Coffee)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateItemCategory(setPersonalUser2, item.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Category</option>
                            {expenseCategories.length === 0 ? (
                              <option value="" disabled>No categories - Create in Settings</option>
                            ) : (
                              expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateItem(setPersonalUser2, item.id, e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {personalUser2.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalUser2, item.id)}
                          className="self-start mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setPersonalUser2, "User 2")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Shared Savings Tab */}
          <TabsContent value="shared-savings" className="space-y-4">
            <div className="space-y-2">
              {sharedSavings.map(item => (
                <div key={item.id} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItemName(setSharedSavings, item.id, e.target.value)}
                      placeholder="Name (e.g., Vacation Fund)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={item.category}
                        onChange={(e) => updateItemCategory(setSharedSavings, item.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select Category</option>
                        {savingsCategories.length === 0 ? (
                          <option value="" disabled>No categories - Create in Settings</option>
                        ) : (
                          savingsCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        )}
                      </select>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setSharedSavings, item.id, e.target.value)}
                        placeholder="Amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {sharedSavings.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setSharedSavings, item.id)}
                      className="self-start mt-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addItem(setSharedSavings)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">{user1Name}</h3>
                <div className="space-y-2">
                  {personalSavingsUser1.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemName(setPersonalSavingsUser1, item.id, e.target.value)}
                          placeholder="Name (e.g., Retirement Fund)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateItemCategory(setPersonalSavingsUser1, item.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Category</option>
                            {savingsCategories.length === 0 ? (
                              <option value="" disabled>No categories - Create in Settings</option>
                            ) : (
                              savingsCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateItem(setPersonalSavingsUser1, item.id, e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {personalSavingsUser1.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalSavingsUser1, item.id)}
                          className="self-start mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setPersonalSavingsUser1, user1Name)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div>
                <h3 
                  className="text-sm font-medium mb-3 cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  onClick={handleUser2NameClick}
                  title="Click to change name"
                >
                  {user2Name}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h3>
                <div className="space-y-2">
                  {personalSavingsUser2.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItemName(setPersonalSavingsUser2, item.id, e.target.value)}
                          placeholder="Name (e.g., Emergency Fund)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateItemCategory(setPersonalSavingsUser2, item.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Category</option>
                            {savingsCategories.length === 0 ? (
                              <option value="" disabled>No categories - Create in Settings</option>
                            ) : (
                              savingsCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))
                            )}
                          </select>
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateItem(setPersonalSavingsUser2, item.id, e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {personalSavingsUser2.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalSavingsUser2, item.id)}
                          className="self-start mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setPersonalSavingsUser2, "User 2")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
