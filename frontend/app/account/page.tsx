"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Shield, Play, Apple, GripVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import { categoriesApi, Category } from "@/lib/categories-api";
import { adminApi } from "@/lib/admin-api";
import { authApi } from "@/lib/auth-api";
import { useAuth } from "@/contexts/AuthContext";
import { isEmojiIcon, isHexColor, getIconComponent, getColorClass } from "@/lib/category-utils";
import CategoryFormFields, { CategoryFormValues } from "@/components/CategoryFormFields";

interface EditingCategory {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

export default function Settings() {
  const { user } = useAuth();

  // Initialize activeTab with default value (no localStorage during SSR)
  const [activeTab, setActiveTab] = useState("Account");
  const [isTabInitialized, setIsTabInitialized] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Helper to get user initials from full name
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  
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
  
  // Profile tab state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
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
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryFormValues>({
    name: "",
    type: "expense",
    icon: "💰",
    color: "#3b82f6",
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [seedingCategories, setSeedingCategories] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

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

  // Fetch user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await authApi.getProfile();
      if (profile.partner_name) {
        setPartnerName(profile.partner_name);
      }
      if (profile.full_name) {
        setFullName(profile.full_name);
      }
      if (profile.email) {
        setEmail(profile.email);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSavePartnerName = async () => {
    try {
      await authApi.updateProfile({ partner_name: partnerName });
      // You might want to add a toast notification here
    } catch (error) {
      console.error("Failed to save partner name", error);
    }
  };

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
    if (!newCategoryForm.name || !newCategoryForm.type || !newCategoryForm.icon || !newCategoryForm.color) {
      setCategoriesError("Please fill in all fields");
      return;
    }

    try {
      setCreatingCategory(true);
      setCategoriesError(null);
      setEditingCategory(null); // Clear any editing state
      const newCategory = await categoriesApi.create({
        name: newCategoryForm.name,
        type: newCategoryForm.type,
        icon: newCategoryForm.icon,
        color: newCategoryForm.color,
      });
      setCategories([...categories, newCategory]);
      // Reset form
      setNewCategoryForm({
        name: "",
        type: "expense",
        icon: "💰",
        color: "#3b82f6",
      });
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

  const handleSeedDefaults = async () => {
    try {
      setSeedingCategories(true);
      setSeedMessage(null);
      setCategoriesError(null);
      const result = await categoriesApi.seedDefaults();
      setSeedMessage(result.message);
      // Reload categories to show the newly seeded ones
      await loadCategories();
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : "Failed to seed default categories");
    } finally {
      setSeedingCategories(false);
    }
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
  const funCategories = categories.filter((c) => c.type === "fun");

  /** Render a category icon badge (handles both emoji and legacy Lucide icons, hex and named colors) */
  const renderCategoryBadge = (icon: string, color: string) => {
    const useHex = isHexColor(color);
    const useEmoji = isEmojiIcon(icon);
    const bgClass = useHex ? "" : getColorClass(color);
    const bgStyle = useHex ? { backgroundColor: color } : undefined;

    if (useEmoji) {
      return (
        <div
          className={`w-10 h-10 ${bgClass} rounded-full flex items-center justify-center flex-shrink-0`}
          style={bgStyle}
        >
          <span className="text-lg leading-none">{icon}</span>
        </div>
      );
    }

    const IconComp = getIconComponent(icon);
    return (
      <div
        className={`w-10 h-10 ${bgClass} rounded-full flex items-center justify-center text-white flex-shrink-0`}
        style={bgStyle}
      >
        <IconComp className="w-5 h-5" />
      </div>
    );
  };

  /** Render a category list section (used for income, expense, savings, fun) */
  const renderCategorySection = (title: string, categoryList: Category[], emptyLabel: string) => (
    <Card className="p-8 bg-white border border-gray-200 rounded-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="space-y-3">
        {categoryList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No {emptyLabel} categories yet.</p>
            <p className="text-xs mt-1">Create one to get started!</p>
          </div>
        ) : (
          categoryList.map((category) => {
            const isEditing =
              editingCategory?.id === category.id && editingCategory?.name !== undefined;

            if (isEditing) {
              return (
                <div
                  key={category.id}
                  className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-300"
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={editingCategory?.name || ""}
                    onChange={(e) =>
                      setEditingCategory(
                        editingCategory ? { ...editingCategory, name: e.target.value } : null
                      )
                    }
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
                {renderCategoryBadge(category.icon, category.color)}
                <span className="flex-1 text-gray-900 font-medium">{category.name}</span>
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
  );

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
        subtitle="Manage your profile, categories, and preferences." 
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
                {user ? getInitials(user.full_name) : "?"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome, {user?.full_name || "User"}!
                </h2>
                <p className="text-sm text-gray-500 mb-8">
                  Manage your account settings and preferences.
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
                placeholder="Enter partner name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button 
                onClick={handleSavePartnerName}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
              >
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
                      {user ? getInitials(user.full_name) : "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{fullName || user?.full_name || "User"}</h3>
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
                Create a new category
              </h2>

              <CategoryFormFields
                values={newCategoryForm}
                onChange={setNewCategoryForm}
                error={categoriesError}
              />

              {/* Create Button */}
              <div className="mt-6 space-y-3">
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

                {seedMessage && (
                  <p className="text-xs text-green-600 font-medium text-center">{seedMessage}</p>
                )}

                <button
                  onClick={handleSeedDefaults}
                  disabled={seedingCategories}
                  className="w-full text-xs text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  {seedingCategories ? "Restoring..." : "Restore default categories"}
                </button>
              </div>
            </Card>

            {/* Right Column - Category Lists */}
            <div className="space-y-6">
              {loadingCategories ? (
                <Card className="p-8 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </Card>
              ) : (
                <>
                  {renderCategorySection("Income Categories", incomeCategories, "income")}
                  {renderCategorySection("Expense Categories", expenseCategories, "expense")}
                  {renderCategorySection("Savings Categories", savingsCategories, "savings")}
                  {renderCategorySection("Fun Categories", funCategories, "fun")}
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
                Migrate Category Icons & Colors
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Converts legacy icon names (e.g. &quot;dollar&quot;) and color names (e.g. &quot;blue&quot;) to the new emoji + hex format (e.g. &quot;💰&quot; / &quot;#3b82f6&quot;). Safe to run multiple times — already-migrated categories are skipped.
              </p>
              <Button 
                onClick={async () => {
                  setAdminLoading(true);
                  setAdminMessage("");
                  setAdminError("");
                  try {
                    const result = await adminApi.migrateCategoryIcons();
                    setAdminMessage(result.message);
                    // Refresh categories to show updated icons
                    await loadCategories();
                  } catch (_err) {
                    setAdminError("Failed to migrate category icons");
                  } finally {
                    setAdminLoading(false);
                  }
                }}
                disabled={adminLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminLoading ? "Migrating..." : "Migrate Icons & Colors"}
              </Button>
            </Card>

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
                This will permanently delete all budget records from the database. This includes all monthly budgets with income, expenses, and savings data you&apos;ve entered.
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
