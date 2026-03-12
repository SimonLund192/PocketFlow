"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, FileUp, ArrowRight, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { uploadCSVFile, uploadCSVText } from "@/lib/import-api";
import { useBudgetDrafts } from "@/contexts/BudgetDraftContext";
import { useMonth } from "@/contexts/MonthContext";
import { makeDraftRow } from "@/lib/budget-draft";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedMonth, setSelectedMonth } = useMonth();
  const { mergeRows, hydrateMonth } = useBudgetDrafts();

  const [targetMonth, setTargetMonth] = useState(selectedMonth);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const routeRowsToBudget = async (rows: Awaited<ReturnType<typeof uploadCSVText>>["rows"]) => {
    const suggestedCount = rows.filter((row) => !!row.category_id).length;

    mergeRows(
      targetMonth,
      rows.map((row) =>
        makeDraftRow({
          name: row.description || "Imported item",
          amount: row.abs_amount || "",
          category_id: row.category_id || "",
          owner_slot: row.owner_slot || "user1",
          include: true,
          source: "import",
          needs_review: !row.category_id,
        }),
      ),
    );

    hydrateMonth(targetMonth, {
      initialized: true,
    });
    setInfo(
      suggestedCount > 0
        ? `Matched ${suggestedCount} imported row${suggestedCount === 1 ? "" : "s"} from your previous categorized budget history.`
        : "Imported rows are ready for review in the budget draft table.",
    );
    setSelectedMonth(targetMonth);
    router.push("/budget");
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const data = await uploadCSVFile(file);
      await routeRowsToBudget(data.rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasteImport = async () => {
    if (!pasteContent.trim()) return;
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const data = await uploadCSVText(pasteContent);
      await routeRowsToBudget(data.rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Import Bank Statement"
        subtitle="Parse transactions here, then review and save everything from the shared budget draft table."
      />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {error && (
          <Card className="p-4 border-red-200 bg-red-50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {info && (
          <Card className="p-4 border-green-200 bg-green-50">
            <p className="text-sm text-green-700">{info}</p>
          </Card>
        )}

        <Card className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Step 1</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Send imported rows into your draft review</h2>
              <p className="mt-2 text-sm text-gray-500">
                We will parse the file, add each row to the budget draft, and open the Budget page so you can edit category, owner, inclusion, and amount in one place.
              </p>
            </div>

            <label className="text-sm text-gray-600">
              Target month
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="mt-2 block rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
          </div>

          {!pasteMode ? (
            <div className="mt-8 space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-gray-300 px-8 py-12 text-center transition-colors hover:border-indigo-400"
              >
                <FileUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-800">Click to upload a CSV file</p>
                <p className="mt-1 text-sm text-gray-500">Rows will open in the budget draft review table</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs uppercase text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <Button variant="outline" className="w-full" onClick={() => setPasteMode(true)}>
                <ClipboardPaste className="w-4 h-4 mr-2" />
                Paste CSV content instead
              </Button>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="min-h-[220px] font-mono text-sm"
                placeholder="Date;Description;Amount&#10;2026-03-01;Groceries;-450,00&#10;2026-03-01;Salary;32000,00"
              />

              <div className="flex gap-3">
                <Button onClick={handlePasteImport} disabled={!pasteContent.trim() || loading}>
                  {loading ? "Parsing..." : "Add to Budget Draft"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setPasteMode(false)}>
                  Back to file upload
                </Button>
              </div>
            </div>
          )}

          {loading && !pasteMode && (
            <p className="mt-4 text-sm text-gray-500">Parsing and moving rows into your budget draft…</p>
          )}
        </Card>
      </div>
    </div>
  );
}
