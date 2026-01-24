"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Grip, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBalanceTrends } from "@/lib/dashboard-api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  priority: number;
  completed: boolean;
  description?: string;
}

function SortableGoalItem({
  goal,
  selectedGoal,
  setSelectedGoal,
  openEditModal,
  deleteGoalHandler,
  getProgress,
}: {
  goal: Goal;
  selectedGoal: Goal | null;
  setSelectedGoal: (goal: Goal) => void;
  openEditModal: (goal: Goal, e: React.MouseEvent) => void;
  deleteGoalHandler: (goalId: string, e: React.MouseEvent) => void;
  getProgress: (goal: Goal) => number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`p-8 cursor-pointer transition-all rounded-3xl ${
          selectedGoal?.id === goal.id
            ? "bg-indigo-600 text-white shadow-lg"
            : "bg-white hover:shadow-md border-2 border-gray-900"
        }`}
        onClick={() => setSelectedGoal(goal)}
      >
        <div className="flex items-center gap-6">
          <button
            className={`p-1 rounded transition-colors cursor-grab active:cursor-grabbing ${
              selectedGoal?.id === goal.id
                ? "text-white/80 hover:text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()} 
          >
            <Grip className="w-6 h-6" />
          </button>
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
              selectedGoal?.id === goal.id
                ? "bg-indigo-500 text-white"
                : "bg-blue-100 text-indigo-600"
            }`}
          >
            #{goal.priority}
          </div>

          {goal.completed ? (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-8"
              style={{
                borderColor:
                  selectedGoal?.id === goal.id
                    ? "rgba(255,255,255,0.4)"
                    : "#22c55e",
                backgroundColor:
                  selectedGoal?.id === goal.id
                    ? "rgba(255,255,255,0.2)"
                    : "white",
                color: selectedGoal?.id === goal.id ? "white" : "#22c55e",
              }}
            >
              100%
            </div>
          ) : (
            <div className="relative w-24 h-24">
              <svg
                className="w-24 h-24 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={
                    selectedGoal?.id === goal.id
                      ? "rgba(255,255,255,0.2)"
                      : "#e5e7eb"
                  }
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={
                    selectedGoal?.id === goal.id
                      ? "rgba(255,255,255,0.4)"
                      : "#22c55e"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${getProgress(goal) * 2.64} ${100 * 2.64}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-2xl font-bold ${
                    selectedGoal?.id === goal.id ? "text-white" : "text-gray-900"
                  }`}
                >
                  {Math.round(getProgress(goal))}%
                </span>
              </div>
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{goal.name}</h3>
            <p
              className={`text-base ${
                selectedGoal?.id === goal.id ? "text-white/90" : "text-gray-600"
              }`}
            >
              {goal.saved.toFixed(2)} kr / {goal.target.toFixed(2)} kr
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className={`p-3 rounded-lg transition-colors ${
                selectedGoal?.id === goal.id
                  ? "hover:bg-white/10"
                  : "hover:bg-gray-100"
              }`}
              onClick={(e) => openEditModal(goal, e)}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              className={`p-3 rounded-lg transition-colors ${
                selectedGoal?.id === goal.id
                  ? "hover:bg-white/10"
                  : "hover:bg-gray-100"
              }`}
              onClick={(e) => deleteGoalHandler(goal.id, e)}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [totalSharedSavings, setTotalSharedSavings] = useState(0);

  const recalculateGoals = (currentGoals: Goal[], totalSavings: number): Goal[] => {
    let remaining = totalSavings;
    // Sort by priority ensures hierarchy is respected
    const sortedGoals = [...currentGoals].sort((a, b) => a.priority - b.priority);
    
    return sortedGoals.map(goal => {
      const amount = Math.min(remaining, goal.target);
      remaining = Math.max(0, remaining - amount);
      const isCompleted = amount >= goal.target; 
      
      return {
        ...goal,
        saved: amount,
        completed: isCompleted
      };
    });
  };

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch goals and balance trends in parallel
        const [goalsResponse, balanceTrends] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/goals`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }),
          getBalanceTrends()
        ]);

        if (!goalsResponse.ok) {
          throw new Error("Failed to fetch goals");
        }

        const goalsData = await goalsResponse.json();
        
        // Calculate total shared savings from trends
        const latestTrend = balanceTrends.length > 0 ? balanceTrends[balanceTrends.length - 1] : { shared: 0 };
        const totalSavings = latestTrend.shared;
        setTotalSharedSavings(totalSavings);

        // Map API response to Goal interface
        const initialGoals: Goal[] = goalsData.map((goal: any) => ({
            id: goal.id,
            name: goal.name,
            saved: 0, // Will be calculated
            target: goal.target_amount,
            priority: goal.priority,
            completed: false, // Will be calculated
            description: goal.description
        }));

        const processedGoals = recalculateGoals(initialGoals, totalSavings);
        setGoals(processedGoals);
        
        if (processedGoals.length > 0 && !selectedGoal) {
          setSelectedGoal(processedGoals[0]);
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };

    fetchGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newGoalName,
          target_amount: parseFloat(newGoalAmount),
          description: newGoalDescription
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal");
      }

      const createdGoal = await response.json();
      
      const newGoalObj: Goal = {
        id: createdGoal.id,
        name: createdGoal.name,
        saved: 0, 
        target: createdGoal.target_amount,
        priority: goals.length + 1,
        completed: false,
        description: createdGoal.description
      };

      const updatedList = recalculateGoals([...goals, newGoalObj], totalSharedSavings);
      setGoals(updatedList);
      setIsAddModalOpen(false);
      setNewGoalName("");
      setNewGoalAmount("");
      setNewGoalDescription("");
      
      // Select the new goal if it's the first one
      if (goals.length === 0) {
        setSelectedGoal(updatedList[0]);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/goals/${editingGoal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingGoal.name,
          target_amount: editingGoal.target,
          description: editingGoal.description
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      const updatedGoal = await response.json();
      
      const updatedGoalObj: Goal = {
        id: updatedGoal.id,
        name: updatedGoal.name,
        saved: updatedGoal.current_amount,
        target: updatedGoal.target_amount,
        priority: editingGoal.priority, // Keep existing priority
        completed: updatedGoal.achieved,
        description: updatedGoal.description
      };

      const updatedList = goals.map(g => g.id === updatedGoal.id ? updatedGoalObj : g);
      const recalculatedList = recalculateGoals(updatedList, totalSharedSavings);
      setGoals(recalculatedList);
      setIsEditModalOpen(false);
      setEditingGoal(null);
      if (selectedGoal?.id === updatedGoal.id) {
        // Find the updated goal in the recalculated list
        const latestSelected = recalculatedList.find(g => g.id === updatedGoal.id);
        if (latestSelected) setSelectedGoal(latestSelected);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      const filteredGoals = goals.filter(g => g.id !== goalId);
      const recalculatedLabels = recalculateGoals(filteredGoals, totalSharedSavings);
      setGoals(recalculatedLabels);
      
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(recalculatedLabels.length > 0 ? recalculatedLabels[0] : null);
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const openEditModal = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  };

  const deleteGoalHandler = (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteGoal(goalId);
  };

  useEffect(() => {
    // Initial fetch of goals could go here
    if (goals.length > 0 && !selectedGoal) {
      setSelectedGoal(goals[0]);
    }
  }, [goals, selectedGoal]);

  const getProgress = (goal: Goal) => {
    if (goal.target <= 0) return 0;
    return Math.min((goal.saved / goal.target) * 100, 100);
  };

  const getRemaining = (goal: Goal) => {
    return Math.max(goal.target - goal.saved, 0);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = goals.findIndex((g) => g.id === active.id);
      const newIndex = goals.findIndex((g) => g.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder array locally
        const reorderedGoals = arrayMove(goals, oldIndex, newIndex);
        
        // Update priorities based on new index
        const updatedGoals = reorderedGoals.map((g, i) => ({
          ...g,
          priority: i + 1
        }));
        
        // Recalculate savings distribution based on new hierarchy
        const finalGoals = recalculateGoals(updatedGoals, totalSharedSavings);
        setGoals(finalGoals);

        // API Call to persist order
        try {
          const token = localStorage.getItem("token");
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/goals/reorder`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              goal_ids: updatedGoals.map(g => g.id)
            })
          });
        } catch (error) {
          console.error("Failed to reorder goals:", error);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Goals" 
        subtitle="Welcome Simon Lund" 
        breadcrumb={["Dashboard", "Goals"]} 
      />

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={goals.map(goal => goal.id)}
                strategy={verticalListSortingStrategy}
              >
                {goals.map((goal) => (
                  <SortableGoalItem
                    key={goal.id}
                    goal={goal}
                    selectedGoal={selectedGoal}
                    setSelectedGoal={setSelectedGoal}
                    openEditModal={openEditModal}
                    deleteGoalHandler={deleteGoalHandler}
                    getProgress={getProgress}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add New Goal */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
            >
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

      {/* Add Goal Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
            <DialogDescription>
              Create a new savings goal. Goals work hierarchically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddGoal}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g., New Car"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Target Amount (kr)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                  placeholder="e.g., 50000"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="What is this goal for?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your savings goal details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGoal}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Goal Name</Label>
                <Input
                  id="edit-name"
                  value={editingGoal?.name}
                  onChange={(e) => setEditingGoal({ ...editingGoal!, name: e.target.value })}
                  placeholder="e.g., New Car"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Target Amount (kr)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editingGoal?.target}
                  onChange={(e) => setEditingGoal({ ...editingGoal!, target: parseFloat(e.target.value) })}
                  placeholder="e.g., 50000"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editingGoal?.description}
                  onChange={(e) => setEditingGoal({ ...editingGoal!, description: e.target.value })}
                  placeholder="What is this goal for?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
