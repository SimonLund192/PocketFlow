"use client";

import { 
  Home, 
  Calendar, 
  Target, 
  Clock, 
  Link2, 
  Settings, 
  HelpCircle,
  Moon,
  Bell,
  Search
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: Calendar, label: "Calendar", active: false },
  { icon: Target, label: "Goals", active: false },
  { icon: Clock, label: "History", active: false },
  { icon: Link2, label: "Integrations", active: false },
  { icon: Settings, label: "Settings", active: false },
  { icon: HelpCircle, label: "Help", active: false },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Home");

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
          const isActive = item.label === activeItem;
          return (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-200 hover:bg-indigo-700 hover:text-white"
              }`}
              aria-label={item.label}
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
