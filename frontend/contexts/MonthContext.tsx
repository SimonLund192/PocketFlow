"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface MonthContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  /** Formatted label like "February 2026" */
  monthLabel: string;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const monthLabel = (() => {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth, monthLabel }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (context === undefined) {
    throw new Error("useMonth must be used within a MonthProvider");
  }
  return context;
}
