"use client";

import { useState, useEffect } from "react";
import { Database as DatabaseIcon, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";

interface Transaction {
  _id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "income" | "expense";
}

export default function Database() {
  const [activeCollection, setActiveCollection] = useState("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const collections = [
    "transactions",
    "budgets",
    "goals",
    "categories",
    "users",
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // This will connect to your backend API
      const response = await fetch(`http://localhost:8000/api/${activeCollection}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // For now, use sample data
      setTransactions([
        {
          _id: "1",
          user_id: "user_001",
          amount: 5000,
          category: "Salary",
          description: "Monthly salary",
          date: "2026-01-15",
          type: "income",
        },
        {
          _id: "2",
          user_id: "user_001",
          amount: 1200,
          category: "Rent",
          description: "Monthly rent payment",
          date: "2026-01-01",
          type: "expense",
        },
        {
          _id: "3",
          user_id: "user_001",
          amount: 250,
          category: "Groceries",
          description: "Weekly grocery shopping",
          date: "2026-01-10",
          type: "expense",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCollection]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Database" 
        subtitle="View and manage database collections" 
        breadcrumb={["Dashboard", "Database"]} 
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Collection Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DatabaseIcon className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Collections</h2>
              <p className="text-sm text-gray-500">
                Viewing: <span className="font-semibold text-gray-900">{activeCollection}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Collection Tabs */}
        <Tabs tabs={collections} activeTab={activeCollection} onTabChange={setActiveCollection} />

        {/* Data Table */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No data found in this collection
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {transaction._id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {transaction.user_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total records: <span className="font-semibold">{transactions.length}</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
