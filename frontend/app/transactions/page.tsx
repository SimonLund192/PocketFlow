"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { categoriesApi, Category } from "@/lib/categories-api";
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
  PiggyBank,
} from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionData, categoryData] = await Promise.all([
          transactionsApi.getAll(),
          categoriesApi.getAll(),
        ]);
        setTransactions(transactionData);
        setCategories(categoryData.filter((cat) => cat.type === "expense"));
      } catch (error) {
        console.error("Failed to load transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes("beauty")) return <Scissors className="w-5 h-5 text-white" />;
    if (normalized.includes("bill") || normalized.includes("fee")) return <FileText className="w-5 h-5 text-white" />;
    if (normalized.includes("car") || normalized.includes("transport")) return <Car className="w-5 h-5 text-white" />;
    if (normalized.includes("education")) return <GraduationCap className="w-5 h-5 text-white" />;
    if (normalized.includes("entertainment") || normalized.includes("fun")) return <Film className="w-5 h-5 text-white" />;
    if (normalized.includes("shop")) return <ShoppingBag className="w-5 h-5 text-white" />;
    if (normalized.includes("food") || normalized.includes("restaurant")) return <Utensils className="w-5 h-5 text-white" />;
    if (normalized.includes("rent") || normalized.includes("home")) return <Home className="w-5 h-5 text-white" />;
    if (normalized.includes("health")) return <HeartPulse className="w-5 h-5 text-white" />;
    if (normalized.includes("salary") || normalized.includes("income")) return <Briefcase className="w-5 h-5 text-white" />;
    if (normalized.includes("savings")) return <PiggyBank className="w-5 h-5 text-white" />;
    return <FileText className="w-5 h-5 text-white" />;
  };

  const getCategoryColor = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes("beauty")) return "bg-emerald-400";
    if (normalized.includes("bill")) return "bg-teal-500";
    if (normalized.includes("car")) return "bg-cyan-500";
    if (normalized.includes("education")) return "bg-sky-500";
    if (normalized.includes("entertainment")) return "bg-indigo-500";
    if (normalized.includes("income")) return "bg-green-500";
    if (normalized.includes("expense")) return "bg-red-500";
    return "bg-gray-400";
  };

  const handleCreateTransaction = async () => {
    setFormError(null);

    if (!formData.description.trim()) {
      setFormError("Please enter a description.");
      return;
    }

    const amountValue = Number(formData.amount);
    if (!amountValue || amountValue <= 0) {
      setFormError("Please enter a valid amount.");
      return;
    }

    if (!formData.category) {
      setFormError("Please select a category.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        amount: amountValue,
        category: formData.category,
        type: "expense" as const,
        description: formData.description.trim(),
        date: new Date().toISOString(),
      };

      const created = await transactionsApi.create(payload);
      setTransactions((prev) => [created, ...prev]);
      setFormData({ description: "", amount: "", category: "" });
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create transaction", error);
      setFormError("Failed to create transaction. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Transactions"
        subtitle="Review your transaction history and add new expenses."
        breadcrumb={["Home", "Transactions"]}
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            Create Transaction
          </Button>
        }
      />

      <div className="p-8">
        <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
          </div>

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
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(tx.category)}`}>
                            {getCategoryIcon(tx.category)}
                          </div>
                          <span className="font-medium text-gray-600">{tx.category}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600 font-medium">
                        {new Date(tx.date).toLocaleDateString("de-DE")}
                      </td>
                      <td className="py-4 text-gray-500">{tx.description}</td>
                      <td className="py-4 text-right font-medium text-gray-600">
                        {tx.type === "expense" ? "-" : ""}
                        {tx.amount.toFixed(2)}
                      </td>
                      <td className="py-4 text-right text-gray-500 pr-4">USD</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No transactions yet. Create your first transaction to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
            <DialogDescription>Add a new expense to your transaction history.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-description">What did you buy?</Label>
              <Input
                id="transaction-description"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Groceries, rent, coffee..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Price</Label>
              <Input
                id="transaction-amount"
                type="number"
                value={formData.amount}
                onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-category">Expense Category</Label>
              <select
                id="transaction-category"
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransaction} disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
