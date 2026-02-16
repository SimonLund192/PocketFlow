"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
} from "lucide-react";
import {
  uploadCSVFile,
  uploadCSVText,
  getImportCategories,
  confirmImport,
  ParsedRow,
  CategoryOption,
  ConfirmResponse,
} from "@/lib/import-api";
import { useMonth } from "@/contexts/MonthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MappedRow extends ParsedRow {
  /** User-assigned category id */
  category_id: string | null;
  owner_slot: "user1" | "user2" | "shared";
  include: boolean;
  /** Editable name (defaults to description) */
  name: string;
}

type Step = "upload" | "map" | "confirm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "upload", label: "Upload", num: 1 },
  { key: "map", label: "Map & Review", num: 2 },
  { key: "confirm", label: "Confirm", num: 3 },
];

function formatCurrency(amount: number) {
  return (
    new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " kr."
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const router = useRouter();
  const { selectedMonth } = useMonth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload step
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState("");

  // Map step
  const [rows, setRows] = useState<MappedRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [detectedHeader, setDetectedHeader] = useState<string[]>([]);

  // Confirm step
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const [targetMonth, setTargetMonth] = useState(selectedMonth);

  // Keep target month in sync if user hasn't confirmed yet
  useEffect(() => {
    if (step === "upload") {
      setTargetMonth(selectedMonth);
    }
  }, [selectedMonth, step]);

  // ---------- Upload handlers ----------

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setLoading(true);
      try {
        const data = await uploadCSVFile(file);
        await proceedToMapping(data.rows, data.header);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handlePasteUpload = useCallback(async () => {
    if (!pasteContent.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const data = await uploadCSVText(pasteContent);
      await proceedToMapping(data.rows, data.header);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteContent]);

  const proceedToMapping = async (
    parsedRows: ParsedRow[],
    header: string[]
  ) => {
    // Fetch categories
    const cats = await getImportCategories();
    setCategories(cats);
    setDetectedHeader(header);

    // Convert to mapped rows
    const mapped: MappedRow[] = parsedRows.map((r) => ({
      ...r,
      name: r.description || "Imported item",
      category_id: null,
      owner_slot: "user1" as const,
      include: true,
    }));

    setRows(mapped);
    setStep("map");
  };

  // ---------- Map handlers ----------

  const updateRow = (index: number, updates: Partial<MappedRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const toggleAll = (include: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, include })));
  };

  const applyBulkCategory = (categoryId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.include && !r.category_id ? { ...r, category_id: categoryId } : r
      )
    );
  };

  const applyBulkOwner = (owner: "user1" | "user2" | "shared") => {
    setRows((prev) =>
      prev.map((r) => (r.include ? { ...r, owner_slot: owner } : r))
    );
  };

  const includedRows = rows.filter((r) => r.include && r.category_id);
  const unmappedCount = rows.filter((r) => r.include && !r.category_id).length;

  // ---------- Confirm handler ----------

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      const entries = includedRows.map((r) => ({
        name: r.name,
        category_id: r.category_id!,
        amount: r.abs_amount,
        owner_slot: r.owner_slot,
      }));
      const res = await confirmImport(targetMonth, entries);
      setResult(res);
      setStep("confirm");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Category helpers for display ----------

  const categoriesByType = categories.reduce(
    (acc, c) => {
      if (!acc[c.type]) acc[c.type] = [];
      acc[c.type].push(c);
      return acc;
    },
    {} as Record<string, CategoryOption[]>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Import Bank Statement" subtitle="Upload, map, and reconcile" />

      <div className="p-8 max-w-6xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {STEPS.map((s, idx) => {
            const isCurrent = s.key === step;
            const isDone =
              STEPS.findIndex((x) => x.key === step) > idx ||
              (step === "confirm" && s.key === "confirm");
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone && s.key !== step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? "text-indigo-600" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
            <button
              className="ml-auto text-red-400 hover:text-red-600"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====== STEP 1: Upload ====== */}
        {step === "upload" && (
          <Card className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Upload your bank statement
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload a .csv file exported from your bank, or paste the CSV
              content directly. We auto-detect Danish bank formats (semicolon-delimited, Danish number formatting).
            </p>

            {!pasteMode ? (
              <div className="space-y-4">
                {/* Drop zone */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && fileInputRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      fileInputRef.current.files = dt.files;
                      fileInputRef.current.dispatchEvent(
                        new Event("change", { bubbles: true })
                      );
                    }
                  }}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    .csv files only
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400 uppercase">or</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setPasteMode(true)}
                >
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Paste CSV content
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Paste your CSV content here...&#10;Date;Description;Amount&#10;2026-01-15;Groceries;-450,00&#10;2026-01-16;Salary;32000,00"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handlePasteUpload}
                    disabled={!pasteContent.trim() || loading}
                  >
                    {loading ? "Parsing..." : "Parse CSV"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPasteMode(false);
                      setPasteContent("");
                    }}
                  >
                    Back to file upload
                  </Button>
                </div>
              </div>
            )}

            {loading && !pasteMode && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Parsing file…
              </div>
            )}
          </Card>
        )}

        {/* ====== STEP 2: Map & Review ====== */}
        {step === "map" && (
          <div className="space-y-6">
            {/* Summary bar */}
            <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm">
                <span>
                  <FileText className="w-4 h-4 inline mr-1 text-gray-400" />
                  <strong>{rows.length}</strong> rows parsed
                </span>
                <span>
                  Columns detected:{" "}
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {detectedHeader.join(", ")}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Target month:</span>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </Card>

            {/* Bulk actions */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-medium text-gray-700">Bulk actions:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(true)}
                >
                  Select all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(false)}
                >
                  Deselect all
                </Button>

                <div className="h-5 w-px bg-gray-200" />

                <label className="text-gray-500">Set unmapped to:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) applyBulkCategory(e.target.value);
                  }}
                >
                  <option value="" disabled>
                    Category…
                  </option>
                  {Object.entries(categoriesByType).map(([type, cats]) => (
                    <optgroup key={type} label={type}>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <label className="text-gray-500">Set owner:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value)
                      applyBulkOwner(
                        e.target.value as "user1" | "user2" | "shared"
                      );
                  }}
                >
                  <option value="" disabled>
                    Owner…
                  </option>
                  <option value="user1">User 1</option>
                  <option value="user2">User 2</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            </Card>

            {/* Row table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={rows.every((r) => r.include)}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Description / Name</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          !row.include ? "opacity-40 bg-gray-50" : ""
                        } hover:bg-gray-50 transition-colors`}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={row.include}
                            onChange={(e) =>
                              updateRow(idx, { include: e.target.checked })
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) =>
                              updateRow(idx, { name: e.target.value })
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                          />
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono whitespace-nowrap ${
                            row.is_expense ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {row.is_expense ? "-" : "+"}
                          {formatCurrency(row.abs_amount)}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className={`w-full border rounded px-2 py-1 text-sm ${
                              !row.category_id
                                ? "border-amber-300 bg-amber-50"
                                : "border-gray-200"
                            }`}
                            value={row.category_id || ""}
                            onChange={(e) =>
                              updateRow(idx, {
                                category_id: e.target.value || null,
                              })
                            }
                          >
                            <option value="">— Select —</option>
                            {Object.entries(categoriesByType).map(
                              ([type, cats]) => (
                                <optgroup key={type} label={type}>
                                  {cats.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </optgroup>
                              )
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="border rounded px-2 py-1 text-sm border-gray-200"
                            value={row.owner_slot}
                            onChange={(e) =>
                              updateRow(idx, {
                                owner_slot: e.target.value as
                                  | "user1"
                                  | "user2"
                                  | "shared",
                              })
                            }
                          >
                            <option value="user1">User 1</option>
                            <option value="user2">User 2</option>
                            <option value="shared">Shared</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setError(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center gap-4">
                {unmappedCount > 0 && (
                  <span className="text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {unmappedCount} row{unmappedCount > 1 ? "s" : ""} still
                    unmapped
                  </span>
                )}
                <Button
                  onClick={handleConfirm}
                  disabled={includedRows.length === 0 || loading}
                >
                  {loading ? "Importing..." : `Import ${includedRows.length} items`}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ====== STEP 3: Confirm / Result ====== */}
        {step === "confirm" && result && (
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Import Complete
            </h2>
            <p className="text-gray-500 mb-6">
              {result.saved_count} item{result.saved_count !== 1 ? "s" : ""}{" "}
              imported into <strong>{targetMonth}</strong>
              {result.error_count > 0 && (
                <span className="text-red-500 ml-1">
                  ({result.error_count} error{result.error_count !== 1 ? "s" : ""})
                </span>
              )}
            </p>

            {result.saved.length > 0 && (
              <div className="mb-6 max-w-lg mx-auto text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Imported items:
                </h3>
                <div className="bg-gray-50 rounded-lg divide-y max-h-60 overflow-y-auto">
                  {result.saved.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-2 text-sm"
                    >
                      <span className="text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">
                          {item.category}
                        </span>
                        <span className="font-mono text-gray-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="mb-6 max-w-lg mx-auto text-left">
                <h3 className="text-sm font-semibold text-red-600 mb-2">
                  Errors:
                </h3>
                <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push("/budget")}>
                View Budget
              </Button>
              <Button
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setResult(null);
                  setError(null);
                  setPasteContent("");
                  setPasteMode(false);
                }}
              >
                Import Another
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
