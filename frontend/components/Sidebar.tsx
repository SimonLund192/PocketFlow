"use client";

import { Home, Target, Calculator, Settings, HelpCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DevUserSwitcher } from "@/components/DevUserSwitcher";
import { AnalyticsIcon } from "@/components/icons/AnalyticsIcon";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Calculator, label: "Budget", href: "/budget" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: AnalyticsIcon, label: "Analytics", href: "/analytics" },
  { icon: LinkIcon, label: "Connections", href: "/connections" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-[#4E4EFF] flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4E4EFF" stroke="#4E4EFF" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#4E4EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#4E4EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-white text-[#4E4EFF]"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <DevUserSwitcher />
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#4E4EFF] font-semibold text-sm">U</span>
        </div>
      </div>
    </aside>
  );
}
