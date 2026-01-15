"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  percentage: number;
  color: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", name: "Car", saved: 1458.30, target: 4580.85, percentage: 20, color: "bg-blue-600" },
    { id: "2", name: "Laptop", saved: 1458.30, target: 4580.85, percentage: 20, color: "bg-green-500" },
    { id: "3", name: "Vacation", saved: 1458.30, target: 4580.85, percentage: 20, color: "bg-green-500" },
    { id: "4", name: "Phone", saved: 1458.30, target: 4580.85, percentage: 20, color: "bg-green-500" },
  ]);

  const [selectedGoal, setSelectedGoal] = useState<Goal>(goals[0]);

  const formatCurrency = (num: number) => {
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Goals</h1>
          <p className="text-gray-500">Welcome Ekash Finance Management</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-blue-600 hover:underline cursor-pointer">Home</span>
          <span>›</span>
          <span className="text-gray-900 font-medium">Goals</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Goals List */}
        <div className="col-span-4 space-y-4">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all ${
                selectedGoal.id === goal.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105"
                  : "hover:shadow-lg"
              }`}
              onClick={() => setSelectedGoal(goal)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Progress Circle */}
                  <div className="relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={selectedGoal.id === goal.id ? "rgba(255,255,255,0.3)" : "#e5e7eb"}
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={selectedGoal.id === goal.id ? "white" : "#10b981"}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - goal.percentage / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${selectedGoal.id === goal.id ? "text-white" : "text-gray-900"}`}>
                        {goal.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Goal Info */}
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-1 ${selectedGoal.id === goal.id ? "text-white" : "text-gray-900"}`}>
                      {goal.name}
                    </h3>
                    <p className={`text-sm ${selectedGoal.id === goal.id ? "text-white/90" : "text-gray-600"}`}>
                      {formatCurrency(goal.saved)} / {formatCurrency(goal.target)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Goal Button */}
          <Button
            variant="outline"
            className="w-full py-6 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add new goals
          </Button>
        </div>

        {/* Right Content - Goal Details */}
        <div className="col-span-8 space-y-6">
          {/* Goal Header */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">{selectedGoal.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Saved Amount and Progress */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Saved</p>
                    <p className="text-4xl font-bold text-blue-600">{formatCurrency(selectedGoal.saved)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Goals</p>
                    <p className="text-4xl font-bold text-gray-900">{formatCurrency(selectedGoal.target)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>25%</span>
                    <span>75%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${selectedGoal.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Last Month</p>
                    <p className="text-2xl font-bold text-blue-600">$42,678</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Expenses</p>
                    <p className="text-2xl font-bold text-blue-600">$1,798</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Taxes</p>
                    <p className="text-2xl font-bold text-blue-600">$255.25</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Debt</p>
                    <p className="text-2xl font-bold text-blue-600">$365,478</p>
                  </CardContent>
                </Card>
              </div>

              {/* Available by Wallet */}
              <Card className="bg-gradient-to-br from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Available by Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">City Bank</p>
                        <p className="font-bold text-gray-900">150$</p>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
