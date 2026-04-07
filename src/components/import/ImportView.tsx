"use client";

import { useState, useRef } from "react";
import type { TradingAccount } from "@/types";
import { parseCsv, MT5_COLUMN_TEMPLATE, GENERIC_TEMPLATE } from "@/lib/csv-parser";
import { Upload, FileText, CheckCircle, AlertCircle, Download, ChevronDown, ChevronUp } from "lucide-react";

const SYSTEM_FIELDS = [
  { key: "instrument", label: "Instrument / Symbol *" },
  { key: "direction", label: "Direction (BUY/SELL) *" },
  { key: "entryPrice", label: "Entry Price *" },
  { key: "openTime", label: "Open Time *" },
  { key: "exitPrice", label: "Exit Price" },
  { key: "stopLoss", label: "Stop Loss" },
  { key: "takeProfit", label: "Take Profit" },
  { key: "closeTime", label: "Close Time" },
  { key: "lotSize", label: "Lot Size" },
  { key: "grossPnl", label: "Gross P&L" },
  { key: "netPnl", label: "Net P&L" },
  { key: "commission", label: "Commission" },
  { key: "swap", label: "Swap" },
  { key: "externalId", label: "Ticket / External ID" },
  { key: "notes", label: "Notes / Comment" },
];

interface ImportViewProps {
  accounts: TradingAccount[];
}

type Step = "upload" | "map" | "confirm" | "done";

export function ImportView({ accounts }: ImportViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [csvContent, setCsvContent] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [accountId, setAccountId] = useState(accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id ?? "");
  const [tradeType, setTradeType] = useState<string>("LIVE");
  const [template, setTemplate] = useState<string>("none");
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setCsvContent(content);
      const { headers, rows } = parseCsv(content);
      setHeaders(headers);
      setRows(rows);
      setStep("map");
    };
    reader.readAsText(file);
  }

  function applyTemplate(tpl: string) {
    setTemplate(tpl);
    if (tpl === "mt5") setMapping({ ...MT5_COLUMN_TEMPLATE } as any);
    else if (tpl === "generic") setMapping({ ...GENERIC_TEMPLATE } as any);
    else setMapping({});
  }

  async function doImport() {
    setImporting(true);
    setError("");
    const res = await fetch("/api/import/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, csvContent, mapping, tradeType }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message ?? JSON.stringify(data.error) ?? "Import failed");
      setImporting(false);
      return;
    }
    setResult(data);
    setStep("done");
    setImporting(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Import Trades</h1>
        <p className="text-sm text-zinc-400">Upload a CSV from your broker or MT5 history export</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-xs">
        {(["upload", "map", "confirm", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold ${step === s ? "bg-indigo-600 text-white" : ["upload","map","confirm","done"].indexOf(step) > i ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>
              {["upload","map","confirm","done"].indexOf(step) > i ? "✓" : i + 1}
            </span>
            <span className={step === s ? "text-zinc-200" : "text-zinc-500"}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <span className="text-zinc-700">→</span>}
          </div>
        ))}
      </div>

      {/* MT5 info box */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs font-semibold text-amber-400 mb-2">MT5 Export Instructions</p>
        <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
          <li>Open MetaTrader 5 → View → Terminal → History tab</li>
          <li>Right-click anywhere → Select "All History"</li>
          <li>Right-click → Save as Report → choose Detailed Report</li>
          <li>Open the .htm file in Excel, export as CSV, then upload here</li>
          <li>Select the <span className="text-amber-400 font-medium">MT5 Template</span> below to auto-map columns</li>
        </ol>
        <a
          href="/csv-templates/mt5-template.csv"
          download
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
        >
          <Download className="h-3 w-3" /> Download MT5 CSV template
        </a>
      </div>

      {step === "upload" && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 p-10 text-center cursor-pointer hover:border-indigo-500/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-300">Click to upload CSV file</p>
            <p className="text-xs text-zinc-500 mt-1">CSV, TSV or exported broker report</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
        </div>
      )}

      {(step === "map" || step === "confirm") && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Import Settings</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Account</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Trade Type</label>
                <select value={tradeType} onChange={(e) => setTradeType(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                  <option value="LIVE">Live</option>
                  <option value="DEMO">Demo</option>
                  <option value="BACKTEST">Backtest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Template</label>
                <select value={template} onChange={(e) => applyTemplate(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                  <option value="none">Manual</option>
                  <option value="mt5">MT5 Detailed Report</option>
                  <option value="generic">Generic CSV</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Column Mapping</h2>
            <p className="text-xs text-zinc-500">Map your CSV columns to Tradezory fields. Required fields are marked with *.</p>
            <div className="grid grid-cols-2 gap-3">
              {SYSTEM_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-400 mb-1">{label}</label>
                  <select
                    value={mapping[key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">— skip —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800/50"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                CSV Preview ({rows.length} rows detected)
              </span>
              {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showPreview && (
              <div className="overflow-x-auto border-t border-zinc-800">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900">
                      {headers.slice(0, 8).map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-zinc-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800/60">
                        {headers.slice(0, 8).map((h) => (
                          <td key={h} className="px-3 py-2 text-zinc-400 whitespace-nowrap">{row[h] ?? "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep("upload"); setCsvContent(""); setHeaders([]); setRows([]); setMapping({}); }} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800">
              Start Over
            </button>
            <button
              onClick={doImport}
              disabled={importing || !mapping.instrument || !mapping.entryPrice || !mapping.openTime}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
            >
              {importing ? "Importing..." : `Import ${rows.length} Trades`}
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-zinc-50 mb-2">Import Complete</h2>
          <div className="flex justify-center gap-8 mt-3">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{result.imported}</p>
              <p className="text-xs text-zinc-500">Imported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-400">{result.skipped}</p>
              <p className="text-xs text-zinc-500">Skipped (duplicates)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-300">{result.total}</p>
              <p className="text-xs text-zinc-500">Total found</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <a href="/journal" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
              View Journal
            </a>
            <button onClick={() => { setStep("upload"); setResult(null); setCsvContent(""); setHeaders([]); setRows([]); }} className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800">
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
