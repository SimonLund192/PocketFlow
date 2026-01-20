"use client";

import { useState } from "react";
import { Moon, Bell, Search, Pencil, Trash2, Grip, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  priority: number;
  completed: boolean;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      name: "Vacation",
      saved: 10000,
      target: 10000,
      priority: 1,
      completed: true,
    },
    {
      id: "2",
      name: "Spain",
      saved: 6000,
      target: 10000,
      priority: 2,
      completed: false,
    },
  ]);

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(goals[0]);

  const getProgress = (goal: Goal) => {
    return Math.min((goal.saved / goal.target) * 100, 100);
  };

  const getRemaining = (goal: Goal) => {
    return Math.max(goal.target - goal.saved, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome Simon Lund</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Here"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Moon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              SL
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Goals</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Goals work hierarchically</h3>
              <p className="text-sm text-blue-700">
                Your savings progress through goals from top to bottom. Complete the first goal before the next one starts progressing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[540px_1fr] gap-6">
          {/* Left Column - Goals List */}
          <div className="space-y-4">
            {/* Vacation Goal - Completed */}
            <Card
              className={`p-8 cursor-pointer transition-all rounded-3xl ${
                selectedGoal?.id === "1"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white hover:shadow-md border-2 border-gray-900"
              }`}
              onClick={() => setSelectedGoal(goals[0])}
            >
              <div className="flex items-center gap-6">
                <button className={`p-1 rounded transition-colors ${
                  selectedGoal?.id === "1" ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-gray-600"
                }`}>
                  <Grip className="w-6 h-6" />
                </button>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
                    selectedGoal?.id === "1"
                      ? "bg-indigo-500 text-white"
                      : "bg-blue-100 text-indigo-600"
                  }`}
                >
                  #1
                </div>
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-8"
                  style={{
                    borderColor: selectedGoal?.id === "1" ? "rgba(255,255,255,0.4)" : "#22c55e",
                    backgroundColor: selectedGoal?.id === "1" ? "rgba(255,255,255,0.2)" : "white",
                    color: selectedGoal?.id === "1" ? "white" : "#22c55e",
                  }}
                >
                  100%
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Vacation</h3>
                  <p className={`text-base ${selectedGoal?.id === "1" ? "text-white/90" : "text-gray-600"}`}>
                    10000.00 kr / 10000.00 kr
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className={`p-3 rounded-lg transition-colors ${
                      selectedGoal?.id === "1"
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    className={`p-3 rounded-lg transition-colors ${
                      selectedGoal?.id === "1"
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>

            {/* Spain Goal - In Progress */}
            <Card
              className={`p-8 cursor-pointer transition-all rounded-3xl ${
                selectedGoal?.id === "2"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white hover:shadow-md border-2 border-gray-900"
              }`}
              onClick={() => setSelectedGoal(goals[1])}
            >
              <div className="flex items-center gap-6">
                <button className={`p-1 rounded transition-colors ${
                  selectedGoal?.id === "2" ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-gray-600"
                }`}>
                  <Grip className="w-6 h-6" />
                </button>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
                    selectedGoal?.id === "2"
                      ? "bg-indigo-500 text-white"
                      : "bg-blue-100 text-indigo-600"
                  }`}
                >
                  #2
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={selectedGoal?.id === "2" ? "rgba(255,255,255,0.2)" : "#e5e7eb"}
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={selectedGoal?.id === "2" ? "rgba(255,255,255,0.4)" : "#22c55e"}
                      strokeWidth="8"
                      strokeDasharray={`${60 * 2.64} ${40 * 2.64}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${selectedGoal?.id === "2" ? "text-white" : "text-gray-900"}`}>
                      60%
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Spain</h3>
                  <p className={`text-base ${selectedGoal?.id === "2" ? "text-white/90" : "text-gray-600"}`}>
                    6000.00 kr / 10000.00 kr
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className={`p-3 rounded-lg transition-colors ${
                      selectedGoal?.id === "2"
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    className={`p-3 rounded-lg transition-colors ${
                      selectedGoal?.id === "2"
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>

            {/* Add New Goal */}
            <button className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add new goals</span>
            </button>
          </div>

          {/* Right Column - Goal Details */}
          {selectedGoal && (
            <Card className="p-8 bg-white">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{selectedGoal.name}</h2>

              {/* Saved Amount */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Saved</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-blue-600">
                    {selectedGoal.saved.toFixed(2)} kr
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedGoal.target.toFixed(2)} kr
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{Math.round((selectedGoal.saved / selectedGoal.target) * 100)}%</span>
                  <span>{100 - Math.round((selectedGoal.saved / selectedGoal.target) * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${getProgress(selectedGoal)}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-8">Goals</p>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="p-6 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getRemaining(selectedGoal).toFixed(2)} kr
                  </p>
                </Card>
                <Card className="p-6 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getProgress(selectedGoal).toFixed(1)}%
                  </p>
                </Card>
                <Card className="p-6 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Status</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                    {selectedGoal.completed ? (
                      <>
                        <span className="text-2xl">✓</span> Achieved
                      </>
                    ) : (
                      "In Progress"
                    )}
                  </p>
                </Card>
              </div>

              {/* Goal Summary */}
              <Card className="p-6 bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Goal Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Target</span>
                    <span className="font-semibold text-gray-900">
                      {selectedGoal.target.toFixed(2)} kr
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Currently Saved</span>
                    <span className="font-semibold text-green-600">
                      {selectedGoal.saved.toFixed(2)} kr
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Still Needed</span>
                    <span className="font-semibold text-blue-600">
                      {getRemaining(selectedGoal).toFixed(2)} kr
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                    <span className="text-gray-600">Completion</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${getProgress(selectedGoal)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900">
                        {getProgress(selectedGoal).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
