"use client";

import { useState } from "react";
import { Moon, Bell, Search, CheckCircle2, Shield, Play, Apple } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Account");
  const [partnerName, setPartnerName] = useState("Aya Laurvigen");
  
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome Simon Lund</p>
          </div>
          <div className="flex items-center gap-4">
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
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              SL
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Account</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {/* Tabs */}
        <div className="flex items-center gap-8 mb-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {activeTab === "Account" && (
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
        {activeTab === "Profile" && (
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
      </div>
    </div>
  );
}
