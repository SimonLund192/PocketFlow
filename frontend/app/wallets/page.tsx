"use client";

import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Landmark,
  Plus,
} from "lucide-react";

const wallets = [
  { id: "city-bank", name: "City Bank", balance: "$221,478", active: true, icon: Landmark },
  { id: "debit-card", name: "Debit Card", balance: "$221,478", active: false, icon: CreditCard },
  { id: "visa-card", name: "Visa Card", balance: "$221,478", active: false, icon: CreditCard },
  { id: "cash", name: "Cash", balance: "$221,478", active: false, icon: Landmark },
];

export default function WalletsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Wallets"
        subtitle="Welcome Ekash Finance Management"
        breadcrumb={["Home", "Wallets"]}
      />

      <div className="p-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Wallets list */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {wallets.map((wallet) => {
              const Icon = wallet.icon;
              return (
                <button
                  key={wallet.id}
                  className={`w-full flex items-center justify-between rounded-2xl border transition-colors px-5 py-4 text-left ${
                    wallet.active
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                      : "bg-white text-gray-900 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        wallet.active ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`font-semibold ${wallet.active ? "text-white" : "text-gray-900"}`}>
                        {wallet.name}
                      </p>
                      <p className={`text-sm ${wallet.active ? "text-indigo-100" : "text-gray-500"}`}>
                        {wallet.balance}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            <button className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left text-gray-900 hover:border-indigo-300">
              <span className="font-semibold">Add new wallet</span>
              <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-indigo-600">
                <Plus className="w-4 h-4" />
              </span>
            </button>
          </div>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <Card className="p-5 bg-white border border-gray-200 rounded-2xl">
              <h2 className="text-lg font-semibold text-gray-900">City Bank</h2>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$221,478</p>
                <div className="flex items-center justify-between mt-6 text-sm">
                  <span className="text-gray-500">Personal Funds</span>
                  <span className="font-semibold text-gray-900">$32,500.28</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-500">Credit Limits</span>
                  <span className="font-semibold text-gray-900">$2,500.00</span>
                </div>
              </Card>

              <Card className="p-6 bg-indigo-950 text-white border border-indigo-900 rounded-2xl relative overflow-hidden">
                <p className="text-sm text-indigo-200">Debit Card</p>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-lg font-semibold tracking-widest">1234 5678 7890 9875</span>
                  <span className="text-sm font-semibold text-indigo-200">VISA</span>
                </div>
                <div className="flex items-center justify-between mt-6 text-sm">
                  <span>Saiful Islam</span>
                  <span>EXP:12/21</span>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-500 font-medium">Monthly Expenses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$432,568</p>
                <div className="flex items-center gap-2 text-sm text-green-600 mt-6">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  <span>+2.47% Last month $24,478</span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$432,568</p>
                <div className="flex items-center gap-2 text-sm text-green-600 mt-6">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  <span>+2.47% Last month $24,478</span>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-500 font-medium">Monthly Expenses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$432,568</p>
                <div className="flex items-center gap-2 text-sm text-green-600 mt-6">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  <span>+2.47% Last month $24,478</span>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white border border-gray-200 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Overtime</h3>
              <div className="h-40 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                Chart placeholder
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
