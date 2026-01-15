"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Phone, CreditCard, CheckCircle, XCircle, Edit2, Eye, Trash2 } from "lucide-react";

interface VerificationItem {
  id: string;
  value: string;
  verified: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("security");
  
  // Social Security Card
  const [ssnName, setSsnName] = useState("Carla Pascle");
  const [ssnNumber, setSsnNumber] = useState("0024 5687 2254 3698");
  const [ssnVerified, setSsnVerified] = useState(true);

  // Email Verification
  const [emails, setEmails] = useState<VerificationItem[]>([
    { id: "1", value: "hello@example.com", verified: true },
    { id: "2", value: "hello@example.com", verified: true },
    { id: "3", value: "hello@example.com", verified: true },
    { id: "4", value: "hello@example.com", verified: false },
  ]);
  const [newEmail, setNewEmail] = useState("");

  // Phone Verification
  const [phones, setPhones] = useState<VerificationItem[]>([
    { id: "1", value: "+1 135 468 45", verified: true },
    { id: "2", value: "+1 135 468 45", verified: true },
    { id: "3", value: "+1 135 468 45", verified: true },
    { id: "4", value: "+1 135 468 45", verified: false },
  ]);
  const [newPhone, setNewPhone] = useState("");

  // Profile form data
  const [profileName, setProfileName] = useState("Hafsa Humaira");
  const [profileEmail, setProfileEmail] = useState("Hello@example.com");
  const [profileNewEmail, setProfileNewEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("**********");
  const [personalFullName, setPersonalFullName] = useState("Hafsa Humaira");
  const [personalEmail, setPersonalEmail] = useState("Hello@example.com");
  const [personalAddress, setPersonalAddress] = useState("123, Central Square, Brooklyn");
  const [personalCity, setPersonalCity] = useState("New York");
  const [personalPostCode, setPersonalPostCode] = useState("25481");
  const [personalCountry, setPersonalCountry] = useState("Select");

  // Categories
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryColor, setCategoryColor] = useState("");

  const [incomeCategories, setIncomeCategories] = useState<Category[]>([
    { id: "1", name: "Salary", icon: "💰", color: "bg-purple-500", type: "income" },
    { id: "2", name: "Business", icon: "💼", color: "bg-red-500", type: "income" },
    { id: "3", name: "Client", icon: "👤", color: "bg-orange-500", type: "income" },
    { id: "4", name: "Gifts", icon: "🎁", color: "bg-yellow-500", type: "income" },
    { id: "5", name: "Insurance", icon: "🔒", color: "bg-yellow-600", type: "income" },
    { id: "6", name: "Loan", icon: "💵", color: "bg-green-500", type: "income" },
    { id: "7", name: "Other", icon: "📁", color: "bg-teal-500", type: "income" },
  ]);

  const [expenseCategories, setExpenseCategories] = useState<Category[]>([
    { id: "1", name: "Beauty", icon: "💄", color: "bg-teal-500", type: "expense" },
    { id: "2", name: "Bills & Fees", icon: "📄", color: "bg-cyan-500", type: "expense" },
    { id: "3", name: "Car", icon: "🚗", color: "bg-cyan-400", type: "expense" },
    { id: "4", name: "Education", icon: "🎓", color: "bg-blue-500", type: "expense" },
    { id: "5", name: "Entertainment", icon: "🎮", color: "bg-blue-600", type: "expense" },
    { id: "6", name: "Family", icon: "👨‍👩‍👧", color: "bg-indigo-500", type: "expense" },
    { id: "7", name: "Food & Drink", icon: "🍔", color: "bg-purple-500", type: "expense" },
    { id: "8", name: "Salary", icon: "💰", color: "bg-purple-600", type: "expense" },
  ]);

  const tabs = [
    { id: "account", label: "Account" },
    { id: "general", label: "General" },
    { id: "profile", label: "Profile" },
    { id: "add-bank", label: "Add Bank" },
    { id: "security", label: "Security" },
    { id: "session", label: "Session" },
    { id: "categories", label: "Categories" },
    { id: "currencies", label: "Currencies" },
    { id: "api", label: "Api" },
    { id: "support", label: "Support" },
  ];

  const addEmail = () => {
    if (newEmail.trim()) {
      setEmails([...emails, { id: Date.now().toString(), value: newEmail, verified: false }]);
      setNewEmail("");
    }
  };

  const addPhone = () => {
    if (newPhone.trim()) {
      setPhones([...phones, { id: Date.now().toString(), value: newPhone, verified: false }]);
      setNewPhone("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security</h1>
        <p className="text-gray-500">Welcome Ekash Finance Management</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>›</span>
          <span className="text-gray-900 font-medium">Security</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-4 py-3"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Categories Content */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Create Category Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Create a new categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-2">
                  Type
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 appearance-none bg-white"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="">Choose...</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              {/* Icon and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Icon
                  </label>
                  <select
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 appearance-none bg-white"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">Choose...</option>
                    <option value="💰">💰 Money</option>
                    <option value="💼">💼 Business</option>
                    <option value="🎁">🎁 Gift</option>
                    <option value="🍔">🍔 Food</option>
                    <option value="🚗">🚗 Car</option>
                    <option value="🏠">🏠 Home</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Color
                  </label>
                  <select
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 appearance-none bg-white"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">Choose...</option>
                    <option value="bg-blue-500">Blue</option>
                    <option value="bg-red-500">Red</option>
                    <option value="bg-green-500">Green</option>
                    <option value="bg-yellow-500">Yellow</option>
                    <option value="bg-purple-500">Purple</option>
                    <option value="bg-pink-500">Pink</option>
                  </select>
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Create new category
              </Button>
            </CardContent>
          </Card>

          {/* Income and Expense Categories */}
          <div className="col-span-2 space-y-6">
            {/* Income Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">
                  Income Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center text-white text-lg flex-shrink-0`}>
                      {category.icon}
                    </div>
                    <span className="flex-1 text-gray-700 font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-green-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-green-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">
                  Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center text-white text-lg flex-shrink-0`}>
                      {category.icon}
                    </div>
                    <span className="flex-1 text-gray-700 font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-green-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-green-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Profile Content */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* User Profile - Left Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">User Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img 
                      src="https://ui-avatars.com/api/?name=Hafsa+Humaira&size=64&background=4E4EFF&color=fff" 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">Hafsa Humaira</h3>
                    <p className="text-sm text-blue-500">Max file size is 20mb</p>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <span className="text-sm font-medium">Choose File</span>
                    <input type="file" className="hidden" accept="image/*" />
                  </label>
                  <span className="ml-3 text-sm text-gray-500">no file selected</span>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save
                </Button>
              </CardContent>
            </Card>

            {/* User Profile - Right Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">User Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New Email */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    New Email
                  </label>
                  <input
                    type="email"
                    value={profileNewEmail}
                    onChange={(e) => setProfileNewEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="**********"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enable two factor authencation on the security page
                  </p>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={personalFullName}
                    onChange={(e) => setPersonalFullName(e.target.value)}
                    placeholder="Hafsa Humaira"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="Hello@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={personalAddress}
                    onChange={(e) => setPersonalAddress(e.target.value)}
                    placeholder="123, Central Square, Brooklyn"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={personalCity}
                    onChange={(e) => setPersonalCity(e.target.value)}
                    placeholder="New York"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* Post Code */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Post Code
                  </label>
                  <input
                    type="text"
                    value={personalPostCode}
                    onChange={(e) => setPersonalPostCode(e.target.value)}
                    placeholder="25481"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">
                    Country
                  </label>
                  <select
                    value={personalCountry}
                    onChange={(e) => setPersonalCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 appearance-none bg-white"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="Select">Select</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Content */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Welcome Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img 
                      src="https://ui-avatars.com/api/?name=Hafsa+Humaira&size=64&background=4E4EFF&color=fff" 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome, Hafsa Humaira!</h3>
                    <p className="text-sm text-gray-500">
                      Looks like you are not verified yet. Verify yourself to use the full potential of Ekash.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button className="flex items-center gap-3 w-full text-left py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-blue-600">Verify account</span>
                  </button>

                  <button className="flex items-center gap-3 w-full text-left py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-600">Two-factor authentication (2FA)</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Download App */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Download App</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Get Verified On Our Mobile App</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Verifying your identity on our mobile app more secure, faster, and reliable.
                  </p>
                </div>

                <div className="space-y-3">
                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">GET IT ON</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </a>

                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="text-sm font-semibold">App Store</div>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Verify & Upgrade */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">VERIFY & UPGRADE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Account Status :</span>
                    <span className="text-sm font-bold text-orange-500">Pending</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your account is unverified. Get verified to enable funding, trading, and withdrawal.
                  </p>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Verified
                </Button>
              </CardContent>
            </Card>

            {/* Earn Commission */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Earn 30% Commission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">
                  Refer your friends and earn 30% of their trading fees.
                </p>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Referral Program
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Security Content */}
      {activeTab === "security" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Social Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Social Security Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SSN Card Visual */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full -mr-16 -mt-16"></div>
                <div className="space-y-3 relative z-10">
                  <div className="space-y-2">
                    <div className="h-2 w-32 bg-white/40 rounded"></div>
                    <div className="h-2 w-32 bg-white/40 rounded"></div>
                    <div className="h-2 w-32 bg-white/40 rounded"></div>
                  </div>
                  <div className="flex items-end justify-between mt-8">
                    <div>
                      <div className="h-2 w-20 bg-white/40 rounded mb-2"></div>
                    </div>
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{ssnName}</h3>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium">{ssnNumber}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Verified</span>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Add New ID
              </Button>
            </CardContent>
          </Card>

          {/* Email Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Email Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {emails.map((email) => (
                  <div key={email.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{email.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {email.verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">Verification pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Email Input */}
              <div className="pt-2 border-t border-gray-200">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
              </div>

              <Button 
                onClick={addEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add New Email
              </Button>
            </CardContent>
          </Card>

          {/* Phone Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Phone Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {phones.map((phone) => (
                  <div key={phone.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{phone.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {phone.verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">Verification pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Phone Input */}
              <div className="pt-2 border-t border-gray-200">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 135 468 45"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
              </div>

              <Button 
                onClick={addPhone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add New Phone
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {!["account", "profile", "security", "categories"].includes(activeTab) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </p>
              <p className="text-sm">This section is under development</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between pt-8 border-t border-gray-200 text-sm text-gray-500">
        <p>© Copyright 2026 <span className="text-blue-600 font-medium">Ekash</span> | All Rights Reserved</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="#" className="hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
