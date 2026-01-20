"use client";

import { Moon, Bell, Search } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, breadcrumb, action }: HeaderProps) {
  const { user } = useAuth();
  
  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="border-l border-gray-300 h-8"></div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-indigo-600">PocketFlow AI</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {action && <div className="mr-4">{action}</div>}
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
          <ProfileDropdown 
            userInitials={user ? getInitials(user.full_name) : "U"} 
            userName={user?.full_name || "User"} 
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          {breadcrumb.map((crumb, index) => (
            <span key={index}>
              {index === breadcrumb.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb}</span>
              ) : (
                <>
                  <span>{crumb}</span>
                  <span className="mx-2">/</span>
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
