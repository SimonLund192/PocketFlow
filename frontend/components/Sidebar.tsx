"use client";

import { 
  Home, 
  Calculator, 
  Target, 
  Settings, 
  HelpCircle,
  BarChart3,
  Database,
} from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calculator, label: "Budget", path: "/budget" },
  { icon: Target, label: "Goals", path: "/goals" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Database, label: "Database", path: "/database" },
  { icon: Settings, label: "Account", path: "/account" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-14 bg-indigo-600 flex flex-col items-center py-4 space-y-6">
      {/* Logo */}
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4">
        <div className="w-6 h-6 bg-indigo-600 rounded" style={{ 
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" 
        }}></div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-200 hover:bg-indigo-700 hover:text-white"
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-white">
        N
      </div>
    </div>
  );
}
