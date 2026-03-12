"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Flag,
  GripVertical,
  Link2,
  ListTodo,
  Pencil,
  PiggyBank,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBalanceTrends } from "@/lib/dashboard-api";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Tabs from "@/components/Tabs";
import GoalItemsInput, {
  GoalItem as GoalItemType,
  calculateGoalItemsTotal,
  isGoalItemComplete,
  normalizeGoalAmount,
  sanitizeGoalItems,
} from "@/components/GoalItemsInput";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { buildAuthHeaders, throwIfUnauthorized } from "@/lib/session";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  priority: number;
  completed: boolean;
  type: "shared" | "fun";
  description?: string;
  items?: GoalItemType[];
}

interface GoalFormState {
  name: string;
  description: string;
  targetAmount: string;
  items: GoalItemType[];
}

function emptyGoalForm(): GoalFormState {
  return {
    name: "",
    description: "",
    targetAmount: "",
    items: [],
  };
}

function goalToFormState(goal: Goal): GoalFormState {
  return {
    name: goal.name,
    description: goal.description || "",
    targetAmount: goal.target ? String(goal.target) : "",
    items: goal.items || [],
  };
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("da-DK", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} kr`;
}

function goalTypeLabel(type: Goal["type"]) {
  return type === "fun" ? "Fun" : "Shared";
}

function laneDescription(type: Goal["type"]) {
  return type === "fun"
    ? "Use personal savings for rewards, treats, and experiences."
    : "Use shared savings for your bigger life plans together.";
}

function buildGoalPayload(form: GoalFormState) {
  const items = sanitizeGoalItems(form.items);
  const targetAmount =
    items.length > 0 ? calculateGoalItemsTotal(items) : normalizeGoalAmount(form.targetAmount) || 0;

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    targetAmount,
    items,
  };
}

function isGoalFormValid(form: GoalFormState) {
  if (!form.name.trim()) return false;

  const items = sanitizeGoalItems(form.items);
  if (items.length > 0) {
    return items.every(isGoalItemComplete) && calculateGoalItemsTotal(items) > 0;
  }

  const target = normalizeGoalAmount(form.targetAmount);
  return target !== null && target > 0;
}

function recalculateAllGoals(currentGoals: Goal[], sharedSavings: number, funSavings: number): Goal[] {
  const sharedGoals = currentGoals
    .filter((goal) => goal.type === "shared")
    .sort((left, right) => left.priority - right.priority);
  const funGoals = currentGoals
    .filter((goal) => goal.type === "fun")
    .sort((left, right) => left.priority - right.priority);

  const distributeSavings = (list: Goal[], availableSavings: number) => {
    let remaining = availableSavings;

    return list.map((goal) => {
      const saved = Math.min(remaining, goal.target);
      remaining = Math.max(0, remaining - saved);

      return {
        ...goal,
        saved,
        completed: saved >= goal.target,
      };
    });
  };

  return [...distributeSavings(sharedGoals, sharedSavings), ...distributeSavings(funGoals, funSavings)];
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof PiggyBank;
}) {
  return (
    <Card className="rounded-[28px] border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </Card>
  );
}

function GoalFormDialog({
  open,
  onOpenChange,
  mode,
  goalType,
  formValues,
  setFormValues,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  goalType: Goal["type"];
  formValues: GoalFormState;
  setFormValues: (values: GoalFormState) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  loading: boolean;
}) {
  const sanitizedItems = useMemo(() => sanitizeGoalItems(formValues.items), [formValues.items]);
  const isUsingSteps = sanitizedItems.length > 0;
  const targetPreview = isUsingSteps
    ? calculateGoalItemsTotal(sanitizedItems)
    : normalizeGoalAmount(formValues.targetAmount) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-0 p-0 shadow-2xl sm:max-w-3xl">
        <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col bg-white">
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 px-6 py-6 text-left">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                  {mode === "create" ? `Add ${goalTypeLabel(goalType)} Goal` : `Edit ${goalTypeLabel(goalType)} Goal`}
                </div>
                <DialogTitle className="text-2xl font-semibold text-slate-950">
                  {mode === "create" ? "Make this goal easy to plan" : "Refine the goal details"}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-2xl text-sm text-slate-600">
                  Set one target, or break the goal into steps and let PocketFlow total it for you.
                </DialogDescription>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Goal total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(targetPreview)}</p>
                </div>
                <div className="rounded-3xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Steps
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{sanitizedItems.length}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid gap-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                  <Label htmlFor={`${mode}-goal-name`}>Goal name</Label>
                  <Input
                    id={`${mode}-goal-name`}
                    value={formValues.name}
                    onChange={(event) =>
                      setFormValues({ ...formValues, name: event.target.value })
                    }
                    placeholder="Summer trip to Italy"
                    className="h-12 rounded-2xl"
                    required
                  />
                  <p className="text-sm text-slate-500">
                    Pick a goal title that will still make sense when you see it in the list later.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`${mode}-goal-target`}>Target amount</Label>
                  <Input
                    id={`${mode}-goal-target`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.targetAmount}
                    onChange={(event) =>
                      setFormValues({ ...formValues, targetAmount: event.target.value })
                    }
                    placeholder="15000"
                    className="h-12 rounded-2xl"
                    disabled={isUsingSteps}
                  />
                  <p className="text-sm text-slate-500">
                    {isUsingSteps
                      ? "The target is currently calculated from the steps below."
                      : "Use this if you want a simple total without breaking the goal into steps."}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${mode}-goal-description`}>Why this goal matters</Label>
                <Textarea
                  id={`${mode}-goal-description`}
                  value={formValues.description}
                  onChange={(event) =>
                    setFormValues({ ...formValues, description: event.target.value })
                  }
                  placeholder="Optional context that helps you remember what this goal is for."
                  className="min-h-[100px] rounded-2xl"
                />
              </div>

              <GoalItemsInput
                items={formValues.items}
                onChange={(items) => setFormValues({ ...formValues, items })}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isGoalFormValid(formValues)}>
              {loading ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create goal" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SortableGoalItem({
  goal,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getProgress,
  getRemaining,
}: {
  goal: Goal;
  isSelected: boolean;
  onSelect: (goalId: string) => void;
  onEdit: (goal: Goal, event: React.MouseEvent) => void;
  onDelete: (goalId: string, event: React.MouseEvent) => void;
  getProgress: (goal: Goal) => number;
  getRemaining: (goal: Goal) => number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "group cursor-pointer rounded-[28px] border p-4 transition-all duration-200",
          isSelected
            ? "border-slate-900 bg-slate-950 text-white shadow-xl"
            : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg",
        )}
        onClick={() => onSelect(goal.id)}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            className={cn(
              "mt-1 rounded-2xl p-2 transition-colors",
              isSelected ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
            )}
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                      isSelected ? "bg-white/10 text-white/75" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    Priority {goal.priority}
                  </span>
                  {goal.completed && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        isSelected ? "bg-emerald-400/20 text-emerald-100" : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-xl font-semibold">{goal.name}</h3>
                <p
                  className={cn(
                    "mt-2 line-clamp-2 text-sm",
                    isSelected ? "text-white/70" : "text-slate-500",
                  )}
                >
                  {goal.description?.trim() || "No extra notes yet. Add a short description to remember the plan behind this goal."}
                </p>
              </div>

              <div className="flex items-center gap-1 self-start">
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl p-2 transition-colors",
                    isSelected ? "hover:bg-white/10" : "hover:bg-slate-100",
                  )}
                  onClick={(event) => onEdit(goal, event)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl p-2 transition-colors",
                    isSelected ? "hover:bg-white/10" : "hover:bg-slate-100",
                  )}
                  onClick={(event) => onDelete(goal.id, event)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_132px]">
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className={cn("text-xs uppercase tracking-[0.18em]", isSelected ? "text-white/55" : "text-slate-400")}>
                      Saved so far
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(goal.saved)}
                      <span className={cn("ml-2 text-sm font-medium", isSelected ? "text-white/65" : "text-slate-500")}>
                        of {formatCurrency(goal.target)}
                      </span>
                    </p>
                  </div>
                  <p className="text-2xl font-semibold">{Math.round(getProgress(goal))}%</p>
                </div>

                <div className={cn("h-2 overflow-hidden rounded-full", isSelected ? "bg-white/10" : "bg-slate-100")}>
                  <div
                    className={cn("h-full rounded-full transition-all", isSelected ? "bg-amber-300" : "bg-slate-900")}
                    style={{ width: `${getProgress(goal)}%` }}
                  />
                </div>
              </div>

              <div
                className={cn(
                  "rounded-3xl border px-4 py-3",
                  isSelected ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50",
                )}
              >
                <p className={cn("text-xs uppercase tracking-[0.18em]", isSelected ? "text-white/55" : "text-slate-400")}>
                  Remaining
                </p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(getRemaining(goal))}</p>
                <p className={cn("mt-2 text-sm", isSelected ? "text-white/65" : "text-slate-500")}>
                  {goal.items?.length ? `${goal.items.length} planned steps` : "Simple total target"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Goals() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState("Shared Goals");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState<GoalFormState>(emptyGoalForm());
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editGoalForm, setEditGoalForm] = useState<GoalFormState>(emptyGoalForm());
  const [totalSharedSavings, setTotalSharedSavings] = useState(0);
  const [totalFunSavings, setTotalFunSavings] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const currentGoalType = activeTab === "Fun Goals" ? "fun" : "shared";

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const [goalsResponse, balanceTrends] = await Promise.all([
          fetch(`${API_BASE_URL}/api/goals`, {
            headers: buildAuthHeaders(false),
          }),
          getBalanceTrends(),
        ]);

        await throwIfUnauthorized(goalsResponse, "Failed to fetch goals");

        const goalsData = await goalsResponse.json();
        const latestTrend =
          balanceTrends.length > 0 ? balanceTrends[balanceTrends.length - 1] : { shared: 0, personal: 0 };

        setTotalSharedSavings(latestTrend.shared);
        setTotalFunSavings(latestTrend.personal);

        const initialGoals: Goal[] = goalsData.map((goal: any) => ({
          id: goal.id,
          name: goal.name,
          saved: 0,
          target: goal.target_amount,
          priority: goal.priority,
          completed: false,
          type: goal.type === "fun" ? "fun" : "shared",
          description: goal.description,
          items: goal.items || [],
        }));

        setGoals(recalculateAllGoals(initialGoals, latestTrend.shared, latestTrend.personal));
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };

    fetchGoals();
  }, [API_BASE_URL]);

  const displayedGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.type === currentGoalType)
        .sort((left, right) => left.priority - right.priority),
    [currentGoalType, goals],
  );

  useEffect(() => {
    if (displayedGoals.length === 0) {
      if (selectedGoalId !== null) {
        setSelectedGoalId(null);
      }
      return;
    }

    if (!selectedGoalId || !displayedGoals.some((goal) => goal.id === selectedGoalId)) {
      setSelectedGoalId(displayedGoals[0].id);
    }
  }, [displayedGoals, selectedGoalId]);

  const selectedGoal = useMemo(
    () => displayedGoals.find((goal) => goal.id === selectedGoalId) || null,
    [displayedGoals, selectedGoalId],
  );

  const summary = useMemo(() => {
    const totalTarget = displayedGoals.reduce((sum, goal) => sum + goal.target, 0);
    const totalSaved = displayedGoals.reduce((sum, goal) => sum + goal.saved, 0);

    return {
      remaining: Math.max(totalTarget - totalSaved, 0),
      completedCount: displayedGoals.filter((goal) => goal.completed).length,
    };
  }, [displayedGoals]);

  const currentSavingsPool = currentGoalType === "shared" ? totalSharedSavings : totalFunSavings;

  const getProgress = (goal: Goal) => {
    if (goal.target <= 0) return 0;
    return Math.min((goal.saved / goal.target) * 100, 100);
  };

  const getRemaining = (goal: Goal) => {
    return Math.max(goal.target - goal.saved, 0);
  };

  const closeAddDialog = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) {
      setNewGoalForm(emptyGoalForm());
    }
  };

  const closeEditDialog = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setEditingGoal(null);
      setEditGoalForm(emptyGoalForm());
    }
  };

  const handleAddGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isGoalFormValid(newGoalForm)) return;

    setLoading(true);

    try {
      const payload = buildGoalPayload(newGoalForm);
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          name: payload.name,
          target_amount: payload.targetAmount,
          description: payload.description || undefined,
          type: currentGoalType,
          items: payload.items,
        }),
      });

      await throwIfUnauthorized(response, "Failed to create goal");
      const createdGoal = await response.json();

      const nextGoal: Goal = {
        id: createdGoal.id,
        name: createdGoal.name,
        saved: 0,
        target: createdGoal.target_amount,
        priority: createdGoal.priority,
        completed: false,
        type: createdGoal.type === "fun" ? "fun" : "shared",
        description: createdGoal.description,
        items: createdGoal.items || [],
      };

      setGoals((current) =>
        recalculateAllGoals([...current, nextGoal], totalSharedSavings, totalFunSavings),
      );
      setSelectedGoalId(nextGoal.id);
      closeAddDialog(false);
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingGoal || !isGoalFormValid(editGoalForm)) return;

    setLoading(true);

    try {
      const payload = buildGoalPayload(editGoalForm);
      const response = await fetch(`${API_BASE_URL}/api/goals/${editingGoal.id}`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          name: payload.name,
          target_amount: payload.targetAmount,
          description: payload.description || undefined,
          type: editingGoal.type,
          items: payload.items,
        }),
      });

      await throwIfUnauthorized(response, "Failed to update goal");
      const updatedGoal = await response.json();

      const nextGoal: Goal = {
        id: updatedGoal.id,
        name: updatedGoal.name,
        saved: updatedGoal.current_amount,
        target: updatedGoal.target_amount,
        priority: updatedGoal.priority ?? editingGoal.priority,
        completed: updatedGoal.achieved,
        type: updatedGoal.type === "fun" ? "fun" : "shared",
        description: updatedGoal.description,
        items: updatedGoal.items || [],
      };

      setGoals((current) =>
        recalculateAllGoals(
          current.map((goal) => (goal.id === nextGoal.id ? nextGoal : goal)),
          totalSharedSavings,
          totalFunSavings,
        ),
      );
      closeEditDialog(false);
    } catch (error) {
      console.error("Error updating goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(false),
      });

      await throwIfUnauthorized(response, "Failed to delete goal");

      setGoals((current) =>
        recalculateAllGoals(
          current.filter((goal) => goal.id !== goalId),
          totalSharedSavings,
          totalFunSavings,
        ),
      );
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const openEditModal = (goal: Goal, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingGoal(goal);
    setEditGoalForm(goalToFormState(goal));
    setIsEditModalOpen(true);
  };

  const deleteGoalHandler = (goalId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setGoalToDelete(goalId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!goalToDelete) return;

    handleDeleteGoal(goalToDelete);
    setGoalToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const currentList = goals
      .filter((goal) => goal.type === currentGoalType)
      .sort((left, right) => left.priority - right.priority);

    const oldIndex = currentList.findIndex((goal) => goal.id === active.id);
    const newIndex = currentList.findIndex((goal) => goal.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSubList = arrayMove(currentList, oldIndex, newIndex).map((goal, index) => ({
      ...goal,
      priority: index + 1,
    }));

    const otherGoals = goals.filter((goal) => goal.type !== currentGoalType);
    const optimisticGoals = recalculateAllGoals(
      [...otherGoals, ...reorderedSubList],
      totalSharedSavings,
      totalFunSavings,
    );

    setGoals(optimisticGoals);

    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/reorder`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          goal_ids: reorderedSubList.map((goal) => goal.id),
        }),
      });

      await throwIfUnauthorized(response, "Failed to reorder goals");
    } catch (error) {
      console.error("Failed to reorder goals:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(254,243,199,0.45),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f8fafc_100%)]">
      <Header
        title="Goals"
        subtitle="Plan the next thing your savings should unlock."
        breadcrumb={["Dashboard", "Goals"]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        <Tabs
          tabs={["Shared Goals", "Fun Goals"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <Card className="rounded-[32px] border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                <Sparkles className="h-4 w-4" />
                {goalTypeLabel(currentGoalType)} goal lane
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Build clearer goals and let the savings order do the hard part.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {laneDescription(currentGoalType)} Higher-priority goals fill first, so keep the list in the order you want your money to flow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="rounded-2xl border-white bg-white/90"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add {currentGoalType === "shared" ? "shared" : "fun"} goal
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label={currentGoalType === "shared" ? "Shared pool" : "Fun pool"}
            value={formatCurrency(currentSavingsPool)}
            hint="Savings currently available to feed this goal lane."
            icon={PiggyBank}
          />
          <StatCard
            label="In this lane"
            value={`${displayedGoals.length} ${displayedGoals.length === 1 ? "goal" : "goals"}`}
            hint={`${summary.completedCount} completed, ${displayedGoals.length - summary.completedCount} still active.`}
            icon={Flag}
          />
          <StatCard
            label="Still needed"
            value={formatCurrency(summary.remaining)}
            hint="Total remaining across all goals in this lane."
            icon={CircleDollarSign}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <Card className="rounded-[32px] border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Goal order
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {goalTypeLabel(currentGoalType)} roadmap
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Drag to change priority. The first goal gets funded before the next one starts moving.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {displayedGoals.length} items
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {displayedGoals.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displayedGoals.map((goal) => goal.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {displayedGoals.map((goal) => (
                        <SortableGoalItem
                          key={goal.id}
                          goal={goal}
                          isSelected={selectedGoalId === goal.id}
                          onSelect={setSelectedGoalId}
                          onEdit={openEditModal}
                          onDelete={deleteGoalHandler}
                          getProgress={getProgress}
                          getRemaining={getRemaining}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ListTodo className="h-5 w-5 text-slate-500" />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-900">
                    No {currentGoalType === "shared" ? "shared" : "fun"} goals yet
                  </h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Start with a simple total or paste each step on its own line and we will organize it for you.
                  </p>
                  <Button className="mt-5 rounded-2xl" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create your first goal
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {selectedGoal ? (
            <Card className="rounded-[32px] border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      Priority {selectedGoal.priority}
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold">{selectedGoal.name}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                      {selectedGoal.description?.trim() || "This goal has no extra notes yet. Add a short description if you want more context when you revisit it later."}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={(event) => openEditModal(selectedGoal, event)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit goal
                  </Button>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                      Saved
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(selectedGoal.saved)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                      Target
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(selectedGoal.target)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                      Remaining
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(getRemaining(selectedGoal))}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                    <span>{Math.round(getProgress(selectedGoal))}% funded</span>
                    <span>{selectedGoal.completed ? "Ready to move to the next goal" : "Still receiving savings"}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-300 transition-all"
                      style={{ width: `${getProgress(selectedGoal)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <Card className="rounded-[28px] border-slate-200 bg-slate-50 p-5 shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Breakdown
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {selectedGoal.items?.length ? "Goal steps" : "Simple target"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedGoal.items?.length
                      ? "Each step contributes to the total target below."
                      : "This goal is tracked as one total target instead of itemized steps."}
                  </p>

                  {selectedGoal.items?.length ? (
                    <div className="mt-5 space-y-3">
                      {selectedGoal.items.map((item, index) => {
                        const share = selectedGoal.target > 0 ? Math.round((item.amount / selectedGoal.target) * 100) : 0;

                        return (
                          <div
                            key={`${item.name}-${index}`}
                            className="rounded-3xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Step {index + 1}
                                </p>
                                <p className="mt-2 text-base font-semibold text-slate-950">{item.name}</p>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900"
                                  >
                                    <Link2 className="h-4 w-4" />
                                    Open link
                                  </a>
                                )}
                              </div>
                              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-right">
                                <p className="text-lg font-semibold text-slate-950">{formatCurrency(item.amount)}</p>
                                <p className="mt-1 text-sm text-slate-500">{share}% of target</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-8">
                      <p className="text-base font-medium text-slate-900">
                        This goal currently uses a single total target.
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Open the edit dialog if you want to split it into steps and let the app total them automatically.
                      </p>
                    </div>
                  )}
                </Card>

                <Card className="rounded-[28px] border-slate-200 bg-white p-5 shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Planning notes
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">How this goal behaves</h3>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">Funding order matters</p>
                      <p className="mt-2 text-sm text-slate-500">
                        This goal is #{selectedGoal.priority} in the {goalTypeLabel(selectedGoal.type).toLowerCase()} lane, so goals above it fill first.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">Current status</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {selectedGoal.completed
                          ? "This goal is fully covered by the available savings in this lane."
                          : `${formatCurrency(getRemaining(selectedGoal))} still needs to be saved before it is complete.`}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">Quick action</p>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-slate-700"
                        onClick={(event) => openEditModal(selectedGoal, event)}
                      >
                        Adjust the target or steps
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[32px] border-slate-200 bg-white/90 p-8 shadow-sm">
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100">
                  <PiggyBank className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-950">Choose a goal to inspect</h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
                  Select a goal on the left to see its target, progress, and step breakdown. If there is nothing here yet, create the first goal for this lane.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <GoalFormDialog
        open={isAddModalOpen}
        onOpenChange={closeAddDialog}
        mode="create"
        goalType={currentGoalType}
        formValues={newGoalForm}
        setFormValues={setNewGoalForm}
        onSubmit={handleAddGoal}
        loading={loading}
      />

      <GoalFormDialog
        open={isEditModalOpen}
        onOpenChange={closeEditDialog}
        mode="edit"
        goalType={editingGoal?.type || currentGoalType}
        formValues={editGoalForm}
        setFormValues={setEditGoalForm}
        onSubmit={handleEditGoal}
        loading={loading}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
