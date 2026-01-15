"use client";

import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface BudgetItem {
  id: string;
  value: string;
  user?: string;
}

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState("income");
  
  // Income items - two columns for users
  const [incomeUser1, setIncomeUser1] = useState<BudgetItem[]>([{ id: "1", value: "", user: "User 1" }]);
  const [incomeUser2, setIncomeUser2] = useState<BudgetItem[]>([{ id: "1", value: "", user: "User 2" }]);
  
  // Shared Expenses - single column
  const [sharedExpenses, setSharedExpenses] = useState<BudgetItem[]>([{ id: "1", value: "" }]);
  
  // Personal Expenses - two columns for users
  const [personalUser1, setPersonalUser1] = useState<BudgetItem[]>([{ id: "1", value: "", user: "User 1" }]);
  const [personalUser2, setPersonalUser2] = useState<BudgetItem[]>([{ id: "1", value: "", user: "User 2" }]);
  
  // Shared Savings - single column
  const [sharedSavings, setSharedSavings] = useState<BudgetItem[]>([{ id: "1", value: "" }]);
  
  // Personal Savings - two columns for users
  const [personalSavingsUser1, setPersonalSavingsUser1] = useState<BudgetItem[]>([{ id: "1", value: "", user: "User 1" }]);
  const [personalSavingsUser2, setPersonalSavingsUser2] = useState<BudgetItem[]>([{ id: "1", value: "", user: "User 2" }]);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Helper functions for managing items
  const addItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, user?: string) => {
    setter(prev => [...prev, { id: Date.now().toString(), value: "", user }]);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<BudgetItem[]>>, id: string, value: string) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, value } : item));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Home</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Budget</span>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                <h3 className="text-sm font-medium mb-3">User 1</h3>
                <div className="space-y-2">
                  {incomeUser1.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setIncomeUser1, item.id, e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {incomeUser1.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setIncomeUser1, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setIncomeUser1, "User 1")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">User 2</h3>
                <div className="space-y-2">
                  {incomeUser2.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setIncomeUser2, item.id, e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {incomeUser2.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setIncomeUser2, item.id)}
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
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => updateItem(setSharedExpenses, item.id, e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {sharedExpenses.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setSharedExpenses, item.id)}
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
                <h3 className="text-sm font-medium mb-3">User 1</h3>
                <div className="space-y-2">
                  {personalUser1.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setPersonalUser1, item.id, e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {personalUser1.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalUser1, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setPersonalUser1, "User 1")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">User 2</h3>
                <div className="space-y-2">
                  {personalUser2.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setPersonalUser2, item.id, e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {personalUser2.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalUser2, item.id)}
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
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => updateItem(setSharedSavings, item.id, e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {sharedSavings.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setSharedSavings, item.id)}
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
                <h3 className="text-sm font-medium mb-3">User 1</h3>
                <div className="space-y-2">
                  {personalSavingsUser1.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setPersonalSavingsUser1, item.id, e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {personalSavingsUser1.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalSavingsUser1, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addItem(setPersonalSavingsUser1, "User 1")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">User 2</h3>
                <div className="space-y-2">
                  {personalSavingsUser2.map(item => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateItem(setPersonalSavingsUser2, item.id, e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {personalSavingsUser2.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(setPersonalSavingsUser2, item.id)}
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
