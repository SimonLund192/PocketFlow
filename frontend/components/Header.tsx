"use client";

import { Search, Bell, Settings, Moon } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-16 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-40">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome PocketFlow Finance Management</p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Here"
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Icons */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Moon className="w-5 h-5 text-gray-600" />
        </button>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#4E4EFF] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}
