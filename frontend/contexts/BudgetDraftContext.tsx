"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { BudgetDraftRow, BudgetDraftState, makeDraftRow } from "@/lib/budget-draft";

interface BudgetDraftContextType {
  drafts: Record<string, BudgetDraftState>;
  getDraftState: (month: string) => BudgetDraftState;
  hydrateMonth: (month: string, payload: Partial<BudgetDraftState>) => void;
  mergeRows: (month: string, rows: BudgetDraftRow[], options?: { budgetId?: string }) => void;
  addRow: (month: string, row?: Partial<BudgetDraftRow>) => void;
  updateRow: (month: string, clientId: string, updates: Partial<BudgetDraftRow>) => void;
  bulkUpdateRows: (month: string, clientIds: string[], updates: Partial<BudgetDraftRow>) => void;
  removeRow: (month: string, clientId: string) => void;
  clearMonth: (month: string) => void;
}

const emptyDraftState = (): BudgetDraftState => ({
  rows: [],
  deletedIds: [],
  initialized: false,
  hasUnsavedChanges: false,
});

const BudgetDraftContext = createContext<BudgetDraftContextType | undefined>(undefined);

export function BudgetDraftProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, BudgetDraftState>>({});

  const getDraftState = useCallback(
    (month: string) => drafts[month] || emptyDraftState(),
    [drafts],
  );

  const hydrateMonth = useCallback((month: string, payload: Partial<BudgetDraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [month]: {
        ...emptyDraftState(),
        ...prev[month],
        ...payload,
      },
    }));
  }, []);

  const mergeRows = useCallback(
    (month: string, rows: BudgetDraftRow[], options?: { budgetId?: string }) => {
      setDrafts((prev) => {
        const current = prev[month] || emptyDraftState();
        const nextRows = [...current.rows];

        for (const row of rows) {
          const matchIndex = nextRows.findIndex(
            (existing) =>
              (row.id && existing.id === row.id) ||
              (!!row.name && !!existing.name && !row.id && !existing.id && existing.name === row.name && existing.amount === row.amount),
          );

          if (matchIndex >= 0) {
            nextRows[matchIndex] = {
              ...nextRows[matchIndex],
              ...row,
              client_id: nextRows[matchIndex].client_id,
            };
          } else {
            nextRows.push(makeDraftRow(row));
          }
        }

        return {
          ...prev,
          [month]: {
            ...current,
            budgetId: options?.budgetId || current.budgetId,
            rows: nextRows,
            initialized: true,
            hasUnsavedChanges: true,
          },
        };
      });
    },
    [],
  );

  const addRow = useCallback((month: string, row?: Partial<BudgetDraftRow>) => {
    setDrafts((prev) => {
      const current = prev[month] || emptyDraftState();
      return {
        ...prev,
        [month]: {
          ...current,
          rows: [...current.rows, makeDraftRow(row)],
          initialized: true,
          hasUnsavedChanges: true,
        },
      };
    });
  }, []);

  const updateRow = useCallback((month: string, clientId: string, updates: Partial<BudgetDraftRow>) => {
    setDrafts((prev) => {
      const current = prev[month] || emptyDraftState();
      return {
        ...prev,
        [month]: {
          ...current,
          rows: current.rows.map((row) =>
            row.client_id === clientId ? { ...row, ...updates } : row,
          ),
          initialized: true,
          hasUnsavedChanges: true,
        },
      };
    });
  }, []);

  const bulkUpdateRows = useCallback((month: string, clientIds: string[], updates: Partial<BudgetDraftRow>) => {
    const ids = new Set(clientIds);
    setDrafts((prev) => {
      const current = prev[month] || emptyDraftState();
      return {
        ...prev,
        [month]: {
          ...current,
          rows: current.rows.map((row) =>
            ids.has(row.client_id) ? { ...row, ...updates } : row,
          ),
          initialized: true,
          hasUnsavedChanges: true,
        },
      };
    });
  }, []);

  const removeRow = useCallback((month: string, clientId: string) => {
    setDrafts((prev) => {
      const current = prev[month] || emptyDraftState();
      const target = current.rows.find((row) => row.client_id === clientId);
      return {
        ...prev,
        [month]: {
          ...current,
          rows: current.rows.filter((row) => row.client_id !== clientId),
          deletedIds: target?.id ? [...current.deletedIds, target.id] : current.deletedIds,
          initialized: true,
          hasUnsavedChanges: true,
        },
      };
    });
  }, []);

  const clearMonth = useCallback((month: string) => {
    setDrafts((prev) => ({
      ...prev,
      [month]: emptyDraftState(),
    }));
  }, []);

  const value = useMemo(
    () => ({
      drafts,
      getDraftState,
      hydrateMonth,
      mergeRows,
      addRow,
      updateRow,
      bulkUpdateRows,
      removeRow,
      clearMonth,
    }),
    [drafts, getDraftState, hydrateMonth, mergeRows, addRow, updateRow, bulkUpdateRows, removeRow, clearMonth],
  );

  return (
    <BudgetDraftContext.Provider value={value}>
      {children}
    </BudgetDraftContext.Provider>
  );
}

export function useBudgetDrafts() {
  const context = useContext(BudgetDraftContext);
  if (!context) {
    throw new Error("useBudgetDrafts must be used within a BudgetDraftProvider");
  }
  return context;
}
