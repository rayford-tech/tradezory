"use client";

import { useState } from "react";
import { Search, ChevronRight, RefreshCw, Upload, PenLine, Check, AlertCircle, Loader2, X, ExternalLink } from "lucide-react";
import type { TradingAccount } from "@/types";

// ─── Broker catalogue ────────────────────────────────────────────────────────

interface Broker {
  id: string;
  name: string;
  platform: "MT5" | "MT4" | "CTRADER" | "TRADOVATE" | "INTERACTIVEBROKERS" | "OTHER";
  autoSync: boolean;
  fileImport: boolean;
  badge?: string;
  icon: string; // emoji fallback
}

const BROKERS: Broker[] = [
  { id: "mt5", name: "MetaTrader 5", platform: "MT5", autoSync: true, fileImport: true, badge: "Popular", icon: "📊" },
  { id: "mt4", name: "MetaTrader 4", platform: "MT4", autoSync: true, fileImport: true, icon: "📈" },
  { id: "ctrader", name: "cTrader", platform: "CTRADER", autoSync: false, fileImport: true, icon: "🔴" },
  { id: "tradovate", name: "Tradovate", platform: "TRADOVATE", autoSync: false, fileImport: true, icon: "🔵" },
  { id: "ib", name: "Interactive Brokers", platform: "INTERACTIVEBROKERS", autoSync: false, fileImport: true, icon: "🏛️" },
  { id: "topstep", name: "TopstepX", platform: "OTHER", autoSync: false, fileImport: true, icon: "🏆" },
  { id: "tradelocker", name: "TradeLocker", platform: "OTHER", autoSync: false, fileImport: true, icon: "🔒" },
  { id: "thinkorswim", name: "Thinkorswim", platform: "OTHER", autoSync: false, fileImport: true, icon: "📉" },
];

type WizardStep = "broker" | "method" | "connect" | "done";
type ImportMethod = "autosync" | "fileupload" | "manual";

interface BrokerWizardProps {
  accounts: TradingAccount[];
  onFileUpload: () => void; // switch to CSV tab
}

// ─── Helper: where to find MT5 credentials ───────────────────────────────────

const MT5_HELP = [
  { step: "1", label: "Open MetaTrader 5" },
  { step: "2", label: "Click File → Login to Trade Account (or see the login dialog on first launch)" },
  { step: "3", label: "Server: shown in the 'Server' dropdown — e.g. \"Exness-MT5Trial2\"" },
  { step: "4", label: "Login: your account number (numbers only) — e.g. \"87654321\"" },
  { step: "5", label: "Password: use your Investor Password (read-only). Find it via Tools → Options → Server tab, or your broker's account email" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function BrokerWizard({ accounts, onFileUpload }: BrokerWizardProps) {
  const [step, setStep] = useState<WizardStep>("broker");
  const [search, setSearch] = useState("");
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [method, setMethod] = useState<ImportMethod | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Connection form state
  const [form, setForm] = useState({
    brokerName: "",
    server: "",
    login: "",
    password: "",
    tradingAccountId: accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id ?? "",
    syncFromDate: "",
  });
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);

  const filtered = BROKERS.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  function selectBroker(b: Broker) {
    setSelectedBroker(b);
    setForm((f) => ({ ...f, brokerName: b.name }));
    setStep("method");
  }

  function selectMethod(m: ImportMethod) {
    setMethod(m);
    if (m === "fileupload") {
      onFileUpload();
      return;
    }
    if (m === "manual") {
      window.location.href = "/journal/new";
      return;
    }
    setStep("connect");
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBroker) return;
    setConnecting(true);
    setConnectError("");

    const res = await fetch("/api/broker-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: selectedBroker.platform,
        brokerName: form.brokerName || selectedBroker.name,
        server: form.server,
        login: form.login,
        password: form.password,
        tradingAccountId: form.tradingAccountId || undefined,
        syncFromDate: form.syncFromDate || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setConnectError(data.error?.message ?? JSON.stringify(data.error) ?? "Connection failed");
      setConnecting(false);
      return;
    }

    setResult(data);
    setStep("done");
    setConnecting(false);
  }

  function reset() {
    setStep("broker");
    setSearch("");
    setSelectedBroker(null);
    setMethod(null);
    setForm({ brokerName: "", server: "", login: "", password: "", tradingAccountId: accounts[0]?.id ?? "", syncFromDate: "" });
    setConnectError("");
    setResult(null);
  }

  // ── Progress bar ────────────────────────────────────────────────────────────

  const STEPS: { key: WizardStep; label: string }[] = [
    { key: "broker", label: "Broker" },
    { key: "method", label: "Method" },
    { key: "connect", label: "Connect" },
    { key: "done", label: "Done" },
  ];
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Add Trades</p>
        <h1 className="text-2xl font-bold text-zinc-50">
          {step === "broker" && "Choose Broker"}
          {step === "method" && "Select Import Method"}
          {step === "connect" && "Broker Sync"}
          {step === "done" && "Connection Created"}
        </h1>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
              i < stepIdx ? "bg-indigo-600 text-white" :
              i === stepIdx ? "bg-indigo-600 text-white ring-2 ring-indigo-400/30" :
              "bg-zinc-800 text-zinc-600"
            }`}>
              {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={`ml-1.5 text-xs ${i === stepIdx ? "text-zinc-200" : "text-zinc-600"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`mx-3 h-px w-8 ${i < stepIdx ? "bg-indigo-600" : "bg-zinc-800"}`} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Choose Broker ── */}
      {step === "broker" && (
        <div className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Start typing the broker name"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Popular Brokers</p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBroker(b)}
                  className="relative flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 text-left hover:border-indigo-500/40 hover:bg-zinc-800/60 transition-all group"
                >
                  {b.badge && (
                    <span className="absolute top-2 right-2 rounded-full bg-indigo-600/20 border border-indigo-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400">
                      {b.badge}
                    </span>
                  )}
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">{b.name}</p>
                    <p className="text-[10px] text-zinc-600">
                      {b.autoSync ? "Auto-sync" : "File upload"} · {b.platform}
                    </p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Select Method ── */}
      {step === "method" && selectedBroker && (
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{selectedBroker.icon}</span>
            <p className="text-sm text-zinc-400">
              You are linking <span className="font-semibold text-zinc-100">{selectedBroker.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Auto-sync */}
            <button
              onClick={() => selectMethod("autosync")}
              disabled={!selectedBroker.autoSync}
              className={`relative flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all ${
                selectedBroker.autoSync
                  ? "border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer"
                  : "border-zinc-800 bg-zinc-900/40 opacity-40 cursor-not-allowed"
              }`}
            >
              {selectedBroker.autoSync && (
                <span className="absolute top-2 left-2 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Recommended</span>
              )}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/20 border border-indigo-500/30">
                <RefreshCw className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Auto-sync</p>
                <p className="text-xs text-zinc-500 mt-0.5">Connect your broker</p>
              </div>
            </button>

            {/* File upload */}
            <button
              onClick={() => selectMethod("fileupload")}
              className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center hover:border-zinc-600 hover:bg-zinc-800/60 transition-all cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                <Upload className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">File upload</p>
                <p className="text-xs text-zinc-500 mt-0.5">Upload broker-provided file with your trading history</p>
              </div>
            </button>

            {/* Manual */}
            <button
              onClick={() => selectMethod("manual")}
              className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center hover:border-zinc-600 hover:bg-zinc-800/60 transition-all cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                <PenLine className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Add manually</p>
                <p className="text-xs text-zinc-500 mt-0.5">Add your trades one by one with our interface</p>
              </div>
            </button>
          </div>

          <button onClick={() => setStep("broker")} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Back to broker selection
          </button>
        </div>
      )}

      {/* ── Step 3: Connect form ── */}
      {step === "connect" && selectedBroker && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: form */}
          <form onSubmit={connect} className="md:col-span-3 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start date</label>
              <input
                type="date"
                value={form.syncFromDate}
                onChange={(e) => setForm((f) => ({ ...f, syncFromDate: e.target.value }))}
                placeholder="Import all records"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1">Leave blank to import all history</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Server <span className="text-red-400">required</span>
              </label>
              <input
                required
                value={form.server}
                onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))}
                placeholder="e.g. Exness-MT5Trial2"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Login <span className="text-red-400">required</span>
              </label>
              <input
                required
                value={form.login}
                onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
                placeholder="Type your account number here"
                inputMode="numeric"
                className="w-full rounded-xl border border-indigo-500/50 bg-indigo-500/5 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Investor Password <span className="text-red-400">required</span>
              </label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Read-only investor password"
                className="w-full rounded-xl border border-indigo-500/50 bg-indigo-500/5 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {accounts.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Link to Account</label>
                <select
                  value={form.tradingAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, tradingAccountId: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Warning box */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400">
                This import uses MetaApi cloud sync. Trades are read-only via your <span className="text-amber-400">Investor Password</span> — we cannot place or modify trades on your behalf. Requires METAAPI_TOKEN environment variable.
              </p>
            </div>

            {connectError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <X className="h-4 w-4 shrink-0" />
                {connectError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("method")} className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800">
                Back
              </button>
              <button
                type="submit"
                disabled={connecting || !form.server || !form.login || !form.password}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
              >
                {connecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</> : "Connect"}
              </button>
            </div>
          </form>

          {/* Right: instructions */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedBroker.icon}</span>
                <div>
                  <p className="text-sm font-bold text-zinc-100">{selectedBroker.name}</p>
                  <span className="text-[10px] rounded-full bg-indigo-600/20 border border-indigo-500/30 px-1.5 py-0.5 text-indigo-400 font-medium">NEW</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-1">Supported Asset Types:</p>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {["Stocks", "Futures", "Options"].map((a) => (
                    <span key={a} className="text-zinc-600 flex items-center gap-0.5"><X className="h-2.5 w-2.5" />{a}</span>
                  ))}
                  {["Forex", "Crypto", "CFD"].map((a) => (
                    <span key={a} className="text-emerald-500 flex items-center gap-0.5"><Check className="h-2.5 w-2.5" />{a}</span>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-zinc-300">Linking {selectedBroker.name}</p>
                  <button onClick={() => setShowHelp(!showHelp)} className="text-[10px] text-indigo-400 hover:text-indigo-300">
                    Need help?
                  </button>
                </div>
                <ol className="space-y-2">
                  {MT5_HELP.map(({ step: s, label }) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-zinc-500">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[9px] text-zinc-400 font-bold mt-0.5">
                        {s}
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>
              </div>

              {showHelp && (
                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-400 mb-2 font-semibold">Where to find your Investor Password</p>
                  <ol className="space-y-1 text-xs text-zinc-500 list-decimal list-inside">
                    <li>Open MT5 → Tools → Options</li>
                    <li>Go to Server tab</li>
                    <li>Click "Change" next to Investor Password</li>
                    <li>Or check your broker's welcome email</li>
                  </ol>
                  <a
                    href="https://www.metatrader5.com/en/terminal/help/startworking/acc_open"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    MT5 documentation <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 mx-auto">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-50">Broker Connected</h2>

          {result.status === "CONNECTING" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Establishing connection to {selectedBroker?.name}...
              </div>
              <p className="text-xs text-zinc-500">
                MetaApi is provisioning your account. This usually takes 1–2 minutes.
                Once connected, trades will sync automatically.
              </p>
            </div>
          ) : result.status === "ERROR" ? (
            <p className="text-sm text-red-400">
              Connection stored but MetaApi is not configured. Add <code className="bg-zinc-800 px-1 rounded">METAAPI_TOKEN</code> to your environment to enable auto-sync.
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              Your broker is connected. Trades will sync automatically.
            </p>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <a href="/journal" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
              View Journal
            </a>
            <button onClick={reset} className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800">
              Add Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
