"use client";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  /** Visual style — "underline" (default) or "pills" */
  variant?: "underline" | "pills";
}

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "underline",
}: TabsProps) {
  if (variant === "pills") {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 ${className}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    );
  }

  // Default: underline
  return (
    <div className={`flex space-x-1 border-b border-gray-200 mb-6 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === tab
              ? "text-gray-900 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
