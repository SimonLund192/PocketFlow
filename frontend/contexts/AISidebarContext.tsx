"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AISidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const AISidebarContext = createContext<AISidebarContextType | undefined>(undefined);

export function AISidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <AISidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </AISidebarContext.Provider>
  );
}

export function useAISidebar() {
  const context = useContext(AISidebarContext);
  if (!context) {
    throw new Error("useAISidebar must be used within an AISidebarProvider");
  }
  return context;
}
