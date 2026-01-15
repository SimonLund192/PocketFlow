"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2 } from "lucide-react";
import { api, Goal } from "@/lib/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [lifetimeSavings, setLifetimeSavings] = useState(0);

  // Load goals and lifetime savings from database on component mount
  useEffect(() => {
    loadGoals();
    loadLifetimeSavings();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const fetchedGoals = await api.getGoals();
      setGoals(fetchedGoals);
      if (fetchedGoals.length > 0 && !selectedGoal) {
        setSelectedGoal(fetchedGoals[0]);
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLifetimeSavings = async () => {
    try {
      const stats = await api.getBudgetLifetimeStats();
      setLifetimeSavings(stats.total_shared_savings);
    } catch (error) {
      console.error("Failed to load lifetime savings:", error);
    }
  };

  const formatCurrency = (num: number) => {
    return `${num.toFixed(2)} kr`;
  };

  // Calculate actual saved amount and percentage based on lifetime savings
  const calculateProgress = (goal: Goal) => {
    const saved = Math.min(lifetimeSavings, goal.target); // Don't exceed target
    const percentage = (saved / goal.target) * 100;
    return {
      saved,
      percentage: Math.min(percentage, 100) // Cap at 100%
    };
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget) {
      alert("Please fill in both name and target amount");
      return;
    }

    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) {
      alert("Please enter a valid target amount");
      return;
    }

    try {
      const newGoal = await api.createGoal({
        name: newGoalName.trim(),
        target: target,
        saved: 0,
        color: "bg-green-500"
      });

      setGoals([...goals, newGoal]);
      setSelectedGoal(newGoal);
      setNewGoalName("");
      setNewGoalTarget("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create goal:", error);
      alert("Failed to create goal. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.deleteGoal(goalId);
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      setGoals(updatedGoals);
      
      // If deleted goal was selected, select first remaining goal or null
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(updatedGoals.length > 0 ? updatedGoals[0] : null);
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
      alert("Failed to delete goal. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading goals...</div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Goals</h1>
            <p className="text-gray-500">Welcome Ekash Finance Management</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <CardContent>
            <p className="text-gray-500 mb-4">No goals yet. Create your first goal to get started!</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Goal
            </Button>
          </CardContent>
        </Card>

        {/* Add New Goal Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Goal</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="goalName" className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Name
                    </label>
                    <input
                      id="goalName"
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="e.g., New Car, Vacation"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700 mb-2">
                      Target Amount (kr)
                    </label>
                    <input
                      id="goalTarget"
                      type="number"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="e.g., 5000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddGoal}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    Add Goal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Home</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Goals</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Goals List */}
        <div className="col-span-4 space-y-4">
          {goals.map((goal, index) => (
            <div key={`goal-${goal.id}-${index}`}>
              <Card
                className={`cursor-pointer transition-all ${
                  selectedGoal?.id === goal.id
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
                        stroke={selectedGoal?.id === goal.id ? "rgba(255,255,255,0.3)" : "#e5e7eb"}
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={selectedGoal?.id === goal.id ? "white" : "#10b981"}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - calculateProgress(goal).percentage / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${selectedGoal?.id === goal.id ? "text-white" : "text-gray-900"}`}>
                        {calculateProgress(goal).percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Goal Info */}
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-1 ${selectedGoal?.id === goal.id ? "text-white" : "text-gray-900"}`}>
                      {goal.name}
                    </h3>
                    <p className={`text-sm ${selectedGoal?.id === goal.id ? "text-white/90" : "text-gray-600"}`}>
                      {formatCurrency(calculateProgress(goal).saved)} / {formatCurrency(goal.target)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGoal(goal.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedGoal?.id === goal.id
                        ? "hover:bg-white/20 text-white"
                        : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                    }`}
                    aria-label="Delete goal"
                  >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
            </div>
          ))}

          {/* Add New Goal Button */}
          <Button
            variant="outline"
            className="w-full py-6 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add new goals
          </Button>
        </div>

        {/* Right Content - Goal Details */}
        <div className="col-span-8 space-y-6">
          {selectedGoal && (() => {
            const progress = calculateProgress(selectedGoal);
            return (
            <>
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
                        <p className="text-4xl font-bold text-blue-600">{formatCurrency(progress.saved)}</p>
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
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedGoal.target - progress.saved)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{progress.percentage.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {progress.percentage >= 100 ? "✓ Achieved" : "In Progress"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Contribution Suggestion */}
              <Card className="bg-gradient-to-br from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Goal Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Total Target</p>
                      <p className="font-bold text-gray-900">{formatCurrency(selectedGoal.target)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Currently Saved</p>
                      <p className="font-bold text-green-600">{formatCurrency(progress.saved)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Still Needed</p>
                      <p className="font-bold text-blue-600">{formatCurrency(selectedGoal.target - progress.saved)}</p>
                    </div>
                    <div className="h-px bg-gray-200 my-2"></div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Completion</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${Math.min(progress.percentage, 100)}%` }}></div>
                        </div>
                        <p className="font-bold text-gray-900">{progress.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
            </>
            );
          })()}
        </div>
      </div>

      {/* Add New Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Content */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Goal</h2>

              <div className="space-y-4">
                {/* Goal Name Input */}
                <div>
                  <label htmlFor="goalName" className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Name
                  </label>
                  <input
                    id="goalName"
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="e.g., New Car, Vacation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Target Amount Input */}
                <div>
                  <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount (kr)
                  </label>
                  <input
                    id="goalTarget"
                    type="number"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  Add Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
