"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Shield, Play, Apple, GripVertical, Pencil, Trash2, DollarSign, Minus, Gamepad2, Receipt, Lightbulb, Heart, Loader2, PiggyBank, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import { categoriesApi, Category } from "@/lib/categories-api";
import { adminApi } from "@/lib/admin-api";

interface EditingCategory {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

export default function Settings() {
  // Initialize activeTab with default value (no localStorage during SSR)
  const [activeTab, setActiveTab] = useState("Account");
  const [isTabInitialized, setIsTabInitialized] = useState(false);
  const [partnerName, setPartnerName] = useState("Aya Laurvigen");
  
  // Load saved tab from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedTab = localStorage.getItem('settingsActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setIsTabInitialized(true);
  }, []);
  
  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    if (isTabInitialized) {
      localStorage.setItem('settingsActiveTab', activeTab);
    }
  }, [activeTab, isTabInitialized]);
  
  // Helper to get color class
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500",
      pink: "bg-pink-500",
      red: "bg-red-500",
      yellow: "bg-yellow-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      indigo: "bg-indigo-500",
    };
    return colorMap[color] || "bg-gray-500";
  };
  
  // Profile tab state
  const [fullName, setFullName] = useState("Simon Lund");
  const [email, setEmail] = useState("Lund16@gmail.com");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [address, setAddress] = useState("123, Central Square, Brooklyn");
  const [city, setCity] = useState("New York");
  const [postCode, setPostCode] = useState("");
  const [country, setCountry] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Categories tab state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Admin tab state
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    if (activeTab === "Categories") {
      loadCategories();
    }
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !newCategoryType || !newCategoryIcon || !newCategoryColor) {
      setCategoriesError("Please fill in all fields");
      return;
    }

    try {
      setCreatingCategory(true);
      setCategoriesError(null);
      setEditingCategory(null); // Clear any editing state
      const newCategory = await categoriesApi.create({
        name: newCategoryName,
        type: newCategoryType as Category["type"],
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      setCategories([...categories, newCategory]);
      // Reset form
      setNewCategoryName("");
      setNewCategoryType("");
      setNewCategoryIcon("");
      setNewCategoryColor("");
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      setCategoriesError(null);
      await categoriesApi.delete(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;

    try {
      setCategoriesError(null);
      const updated = await categoriesApi.update(editingCategory.id, {
        name: editingCategory.name,
        type: editingCategory.type as Category["type"],
        icon: editingCategory.icon,
        color: editingCategory.color,
      });
      setCategories(categories.map((c) => (c.id === editingCategory.id ? updated : c)));
      setEditingCategory(null);
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  // Admin handlers
  const handleClearTransactions = async () => {
    if (!confirm("Are you sure you want to delete ALL transactions? This cannot be undone!")) {
      return;
    }

    try {
      setAdminLoading(true);
      setAdminError(null);
      const result = await adminApi.clearTransactions();
      setAdminMessage(result.message);
      setTimeout(() => setAdminMessage(null), 5000);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Failed to clear transactions");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleClearBudgets = async () => {
    if (!confirm("Are you sure you want to delete ALL budgets? This cannot be undone!")) {
      return;
    }

    try {
      setAdminLoading(true);
      setAdminError(null);
      const result = await adminApi.clearBudgets();
      setAdminMessage(result.message);
      setTimeout(() => setAdminMessage(null), 5000);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Failed to clear budgets");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleClearAllData = async () => {
    const firstConfirm = confirm(
      "⚠️ WARNING ⚠️\n\nThis will delete ALL your data including:\n- Transactions\n- Budgets\n- Categories\n- Goals\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?"
    );
    
    if (!firstConfirm) return;

    const secondConfirm = confirm(
      "⚠️ FINAL WARNING ⚠️\n\nThis is your last chance to cancel.\n\nClick OK to permanently delete ALL data."
    );

    if (!secondConfirm) return;

    try {
      setAdminLoading(true);
      setAdminError(null);
      const result = await adminApi.clearAllData();
      setAdminMessage(`✅ ${result.message}`);
      // Reload categories if on Categories tab
      if (activeTab === "Categories") {
        loadCategories();
      }
      setTimeout(() => setAdminMessage(null), 8000);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Failed to clear all data");
    } finally {
      setAdminLoading(false);
    }
  };

  // Separate categories by type
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const savingsCategories = categories.filter((c) => c.type === "savings");

  const tabs = [
    "Account",
    "General",
    "Profile",
    "Add Bank",
    "Security",
    "Session",
    "Categories",
    "Currencies",
    "Api",
    "Support",
    "Admin",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Account" 
        subtitle="Welcome Simon Lund" 
        breadcrumb={["Dashboard", "Account"]} 
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Tabs - only render after initialization to prevent flash */}
        {isTabInitialized && (
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Content Grid */}
        {isTabInitialized && activeTab === "Account" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Welcome Card */}
            <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                SL
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome, Simon Lund!
                </h2>
                <p className="text-sm text-gray-500 mb-8">
                  Account created on 15. januar 2026
                </p>

                {/* Verify Account */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-indigo-600 font-medium">Verify account</span>
                </div>

                {/* Two-factor Authentication */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-indigo-600 font-medium">
                    Two-factor authentication (2FA)
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Download App Card */}
          <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Download App</h2>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Get Verified On Our Mobile App
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Verifying your identity on our mobile app more secure, faster, and reliable.
            </p>

            {/* Google Play Button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-4 px-6 flex items-center justify-center gap-3 mb-3 transition-colors">
              <Play className="w-6 h-6 fill-white" />
              <div className="text-left">
                <div className="text-xs">GET IT ON</div>
                <div className="text-base font-semibold">Google Play</div>
              </div>
            </button>

            {/* App Store Button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-4 px-6 flex items-center justify-center gap-3 transition-colors">
              <Apple className="w-6 h-6 fill-white" />
              <div className="text-left">
                <div className="text-xs">Download on the</div>
                <div className="text-base font-semibold">App Store</div>
              </div>
            </button>
          </Card>

          {/* Partner/User 2 Name Card */}
          <Card className="p-8 bg-white border border-gray-200 rounded-2xl col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Partner/User 2 Name
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Customize the name displayed for the second user/partner in budget management.
            </p>

            <div className="flex items-center gap-4">
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                Save
              </Button>
            </div>
          </Card>

          {/* Verify & Upgrade Card */}
          <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              VERIFY & UPGRADE
            </h2>

            <div className="mb-4">
              <span className="text-sm text-gray-700 font-medium">Account Status : </span>
              <span className="text-sm text-orange-600 font-bold">Pending</span>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Your account is unverified. Get verified to enable funding, trading, and withdrawal.
            </p>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
              Get Verified
            </Button>
          </Card>

          {/* Earn 30% Commission Card */}
          <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Earn 30% Commission
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Refer your friends and earn 30% of their trading fees.
            </p>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
              Referral Program
            </Button>
          </Card>
        </div>
        )}

        {/* Profile Tab */}
        {isTabInitialized && activeTab === "Profile" && (
          <div className="space-y-6">
            {/* Top Row - User Profile Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Profile Card - Avatar Upload */}
              <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">User Profile</h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Avatar Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      SL
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{fullName}</h3>
                      <p className="text-xs text-blue-600">Max file size is 20mb</p>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="inline-block">
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors mr-3">
                      Choose File
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file.name);
                        }
                      }}
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {selectedFile || "no file selected"}
                  </span>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                  Save
                </Button>
              </Card>

              {/* Right Profile Card - Email & Password */}
              <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">User Profile</h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    New Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Enable two factor authencation on the security page
                </p>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                  Save
                </Button>
              </Card>
            </div>

            {/* Bottom Row - Personal Information */}
            <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Personal Information
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Row 1: Full Name & Email */}
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>

                {/* Row 2: Address & City */}
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>

                {/* Row 3: Post Code & Country */}
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Post Code
                  </label>
                  <input
                    type="text"
                    value={postCode}
                    onChange={(e) => setPostCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {isTabInitialized && activeTab === "Categories" && (
          <div className="grid grid-cols-[480px_1fr] gap-6">
            {/* Left Column - Create Category Form */}
            <Card className="p-8 bg-white border border-gray-200 rounded-2xl h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Create a new categories
              </h2>

              {/* Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-blue-600 mb-3">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
                />
              </div>

              {/* Type Select */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-blue-600 mb-3">
                  Type
                </label>
                <select
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-medium appearance-none bg-white hover:border-gray-300 transition-colors cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%234F46E5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                  }}
                >
                  <option value="" className="text-gray-400">Choose a budget type...</option>
                  <option value="income" className="text-gray-900">💰 Income</option>
                  <option value="expense" className="text-gray-900">💸 Expense</option>
                  <option value="savings" className="text-gray-900">🏦 Savings</option>
                </select>
              </div>

              {/* Icon and Color Row */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Icon Select */}
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Icon
                  </label>
                  <select
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-medium appearance-none bg-white hover:border-gray-300 transition-colors cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%234F46E5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                    }}
                  >
                    <option value="" className="text-gray-400">Choose...</option>
                    <option value="dollar" className="text-gray-900">💵 Dollar</option>
                    <option value="minus" className="text-gray-900">➖ Minus</option>
                    <option value="gamepad" className="text-gray-900">🎮 Gamepad</option>
                    <option value="receipt" className="text-gray-900">🧾 Receipt</option>
                    <option value="lightbulb" className="text-gray-900">💡 Lightbulb</option>
                    <option value="heart" className="text-gray-900">❤️ Heart</option>
                  </select>
                </div>

                {/* Color Select */}
                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-3">
                    Color
                  </label>
                  <select
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-medium appearance-none bg-white hover:border-gray-300 transition-colors cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%234F46E5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                    }}
                  >
                    <option value="" className="text-gray-400">Choose...</option>
                    <option value="blue" className="text-gray-900">🔵 Blue</option>
                    <option value="pink" className="text-gray-900">🩷 Pink</option>
                    <option value="red" className="text-gray-900">🔴 Red</option>
                    <option value="yellow" className="text-gray-900">🟡 Yellow</option>
                    <option value="green" className="text-gray-900">🟢 Green</option>
                    <option value="purple" className="text-gray-900">🟣 Purple</option>
                    <option value="orange" className="text-gray-900">🟠 Orange</option>
                  </select>
                </div>
              </div>

              {/* Create Button */}
              {categoriesError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {categoriesError}
                </div>
              )}
              <Button
                onClick={handleCreateCategory}
                disabled={creatingCategory}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCategory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create new category"
                )}
              </Button>
            </Card>

            {/* Right Column - Category Lists */}
            <div className="space-y-6">
              {loadingCategories ? (
                <Card className="p-8 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </Card>
              ) : (
                <>
                  {/* Income Categories */}
              <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Income Categories
                </h2>

                <div className="space-y-3">
                  {incomeCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No income categories yet.</p>
                      <p className="text-xs mt-1">Create one to get started!</p>
                    </div>
                  ) : (
                    incomeCategories.map((category) => {
                    const isEditing = editingCategory?.id === category.id && editingCategory?.name !== undefined;
                    let IconComponent = DollarSign;
                    if (category.icon === "minus") IconComponent = Minus;
                    if (category.icon === "gamepad") IconComponent = Gamepad2;
                    if (category.icon === "receipt") IconComponent = Receipt;
                    if (category.icon === "lightbulb") IconComponent = Lightbulb;
                    if (category.icon === "heart") IconComponent = Heart;

                    if (isEditing) {
                      return (
                        <div
                          key={category.id}
                          className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-300"
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={editingCategory?.name || ''}
                            onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={category.id}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <div className={`w-10 h-10 ${getColorClass(category.color)} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-gray-900 font-medium">
                          {category.name}
                        </span>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    );
                  })
                  )}
                </div>
              </Card>

              {/* Expense Categories */}
              <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Expense Categories
                </h2>

                <div className="space-y-3">
                  {expenseCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No expense categories yet.</p>
                      <p className="text-xs mt-1">Create one to get started!</p>
                    </div>
                  ) : (
                    expenseCategories.map((category) => {
                    const isEditing = editingCategory?.id === category.id && editingCategory?.name !== undefined;
                    let IconComponent = Minus;
                    if (category.icon === "gamepad") IconComponent = Gamepad2;
                    if (category.icon === "receipt") IconComponent = Receipt;
                    if (category.icon === "lightbulb") IconComponent = Lightbulb;
                    if (category.icon === "heart") IconComponent = Heart;
                    if (category.icon === "dollar") IconComponent = DollarSign;

                    if (isEditing) {
                      return (
                        <div
                          key={category.id}
                          className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-300"
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={editingCategory?.name || ''}
                            onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={category.id}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <div className={`w-10 h-10 ${getColorClass(category.color)} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-gray-900 font-medium">
                          {category.name}
                        </span>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    );
                  })
                  )}
                </div>
              </Card>

              {/* Savings Categories */}
              <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Savings Categories
                </h2>

                <div className="space-y-3">
                  {savingsCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No savings categories yet.</p>
                      <p className="text-xs mt-1">Create one to get started!</p>
                    </div>
                  ) : (
                    savingsCategories.map((category) => {
                    const isEditing = editingCategory?.id === category.id && editingCategory?.name !== undefined;
                    let IconComponent = DollarSign;
                    if (category.icon === "piggy-bank") IconComponent = PiggyBank;
                    if (category.icon === "landmark") IconComponent = Landmark;
                    if (category.icon === "heart") IconComponent = Heart;
                    if (category.icon === "dollar") IconComponent = DollarSign;

                    if (isEditing) {
                      return (
                        <div
                          key={category.id}
                          className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-300"
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={editingCategory?.name || ''}
                            onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={category.id}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <div className={`w-10 h-10 ${getColorClass(category.color)} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-gray-900 font-medium">
                          {category.name}
                        </span>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    );
                  })
                  )}
                </div>
              </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {isTabInitialized && activeTab === "Admin" && (
          <div className="max-w-4xl">
            {/* Warning Banner */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    Database Administration
                  </h3>
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <span className="font-bold">⚠</span>
                    <span className="font-semibold">
                      Danger Zone: These actions permanently delete data and cannot be undone!
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {adminMessage && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">{adminMessage}</p>
              </div>
            )}
            {adminError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">{adminError}</p>
              </div>
            )}

            {/* Clear All Transactions */}
            <Card className="p-8 bg-white border border-gray-200 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Clear All Transactions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete all transaction records from the database. This includes all income and expense transactions created from the seed data or manually added.
              </p>
              <div className="mb-6">
                <span className="text-sm text-gray-700">Collection: </span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                  transactions
                </code>
              </div>
              <Button 
                onClick={handleClearTransactions}
                disabled={adminLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminLoading ? "Clearing..." : "Clear Transactions"}
              </Button>
            </Card>

            {/* Clear All Budgets */}
            <Card className="p-8 bg-white border border-gray-200 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Clear All Budgets
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete all budget records from the database. This includes all monthly budgets with income, expenses, and savings data you've entered.
              </p>
              <div className="mb-6">
                <span className="text-sm text-gray-700">Collection: </span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                  budgets
                </code>
              </div>
              <Button 
                onClick={handleClearBudgets}
                disabled={adminLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminLoading ? "Clearing..." : "Clear Budgets"}
              </Button>
            </Card>

            {/* Clear ALL Data - Final Warning */}
            <Card className="p-8 bg-white border-2 border-red-600 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <svg
                  className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-xl font-bold text-red-900">
                  Clear ALL Data
                </h3>
              </div>
              <p className="text-sm text-red-700 font-semibold mb-6 flex items-start gap-2">
                <span className="font-bold">⚠</span>
                <span>
                  EXTREME CAUTION: This will delete EVERYTHING from the database including transactions, budgets, categories, and goals!
                </span>
              </p>
              <Button 
                onClick={handleClearAllData}
                disabled={adminLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminLoading ? "Clearing..." : "Clear ALL Data"}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
