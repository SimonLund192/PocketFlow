"use client";

import { useState, useEffect } from "react";
import { Database as DatabaseIcon, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";

interface Document {
  [key: string]: any;
}

export default function Database() {
  const [activeCollection, setActiveCollection] = useState("transactions");
  const [collections, setCollections] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/database/collections", {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
        if (data.length > 0 && !activeCollection) {
          setActiveCollection(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataResponse, countResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/database/${activeCollection}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`http://localhost:8000/api/database/${activeCollection}/count`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setDocuments(data);
      } else {
        const errorData = await dataResponse.json();
        setError(errorData.detail || "Failed to fetch data");
      }

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setCount(countData.count);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (activeCollection) {
      fetchData();
    }
  }, [activeCollection]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Database" 
        subtitle="View and manage database collections" 
        breadcrumb={["Dashboard", "Database"]} 
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Collection Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DatabaseIcon className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Collections</h2>
              <p className="text-sm text-gray-500">
                Viewing: <span className="font-semibold text-gray-900">{activeCollection}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Collection Tabs */}
        {collections.length > 0 && (
          <Tabs tabs={collections} activeTab={activeCollection} onTabChange={setActiveCollection} />
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Data Table */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {documents.length > 0 &&
                    Object.keys(documents[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  {documents.length === 0 && !loading && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No columns
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={100} className="px-6 py-8 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={100} className="px-6 py-8 text-center text-gray-500">
                      No data found in this collection
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, index) => (
                    <tr key={doc._id || index} className="hover:bg-gray-50 transition-colors">
                      {Object.entries(doc).map(([key, value]) => (
                        <td key={key} className="px-6 py-4 text-sm text-gray-700">
                          {renderValue(value)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Total records: <span className="font-semibold">{count}</span>
            </p>
            <p className="text-sm text-gray-600">
              Showing: <span className="font-semibold">{documents.length}</span> of{" "}
              <span className="font-semibold">{count}</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderValue(value: any): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    if (value instanceof Date) {
      return new Date(value).toLocaleString();
    }
    // Try to parse ISO date strings
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return value;
      }
    }
    return JSON.stringify(value, null, 0);
  }
  if (typeof value === "boolean") {
    return value ? "✓" : "✗";
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
}
