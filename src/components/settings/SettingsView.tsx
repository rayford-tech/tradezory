"use client";

import { useState } from "react";
import type { User, TradingAccount, SetupTag, MistakeTag } from "@/types";
import { Plus, Trash2, Check, Pencil, X } from "lucide-react";

interface SettingsViewProps {
  user: User;
  accounts: TradingAccount[];
  setupTags: SetupTag[];
  mistakeTags: MistakeTag[];
  mt5WebhookSecret?: string;
}

export function SettingsView({ user, accounts, setupTags, mistakeTags, mt5WebhookSecret }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "accounts" | "tags" | "mt5">("profile");

  const [profileName, setProfileName] = useState(user.name ?? "");
  const [profileTimezone, setProfileTimezone] = useState(user.timezone ?? "UTC");
  const [savingProfile, setSavingProfile] = useState(false);

  // Account form
  const [newAccount, setNewAccount] = useState({ name: "", broker: "", accountNumber: "", type: "LIVE", currency: "USD" });
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Setup tag form
  const [newSetupTag, setNewSetupTag] = useState({ name: "", color: "#6366f1" });
  const [newMistakeTag, setNewMistakeTag] = useState({ name: "", color: "#ef4444" });

  // Tag edit state
  const [editingSetupTag, setEditingSetupTag] = useState<{ id: string; name: string; color: string } | null>(null);
  const [editingMistakeTag, setEditingMistakeTag] = useState<{ id: string; name: string; color: string } | null>(null);

  async function saveProfile() {
    setSavingProfile(true);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profileName, timezone: profileTimezone }) });
    setSavingProfile(false);
  }

  async function createAccount() {
    setCreatingAccount(true);
    await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAccount) });
    window.location.reload();
  }

  async function deleteAccount(id: string) {
    if (!confirm("Delete this account and all its trades?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  async function createSetupTag() {
    if (!newSetupTag.name.trim()) return;
    await fetch("/api/setup-tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSetupTag) });
    window.location.reload();
  }

  async function createMistakeTag() {
    if (!newMistakeTag.name.trim()) return;
    await fetch("/api/mistake-tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMistakeTag) });
    window.location.reload();
  }

  async function saveSetupTag() {
    if (!editingSetupTag) return;
    await fetch(`/api/setup-tags/${editingSetupTag.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingSetupTag.name, color: editingSetupTag.color }) });
    setEditingSetupTag(null);
    window.location.reload();
  }

  async function deleteSetupTag(id: string) {
    if (!confirm("Delete this setup tag? It will be removed from all trades.")) return;
    await fetch(`/api/setup-tags/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  async function saveMistakeTag() {
    if (!editingMistakeTag) return;
    await fetch(`/api/mistake-tags/${editingMistakeTag.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingMistakeTag.name, color: editingMistakeTag.color }) });
    setEditingMistakeTag(null);
    window.location.reload();
  }

  async function deleteMistakeTag(id: string) {
    if (!confirm("Delete this mistake tag? It will be removed from all trades.")) return;
    await fetch(`/api/mistake-tags/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "accounts", label: "Accounts" },
    { key: "tags", label: "Tags" },
    { key: "mt5", label: "MT5 Integration" },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-zinc-50">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${activeTab === t.key ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200">Profile</h2>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Display Name</label>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
            <input value={user.email} disabled className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Timezone</label>
            <select
              value={profileTimezone}
              onChange={(e) => setProfileTimezone(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (ET) — New York</option>
              <option value="America/Chicago">Central (CT/CST) — Chicago</option>
              <option value="America/Denver">Mountain (MT) — Denver</option>
              <option value="America/Los_Angeles">Pacific (PT) — Los Angeles</option>
              <option value="America/Sao_Paulo">Brazil (BRT) — São Paulo</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Berlin">Central Europe (CET) — Frankfurt/Berlin</option>
              <option value="Europe/Moscow">Moscow (MSK)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
              <option value="Asia/Kolkata">India (IST) — Mumbai</option>
              <option value="Asia/Singapore">Singapore (SGT)</option>
              <option value="Asia/Tokyo">Japan (JST) — Tokyo</option>
              <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
              <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
              <option value="Pacific/Auckland">New Zealand (NZDT/NZST)</option>
            </select>
            <p className="mt-1 text-[10px] text-zinc-600">Used to correctly assign trades to your local trading day.</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Plan</label>
            <span className="inline-flex items-center rounded-full bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400">{user.plan}</span>
          </div>
          <button onClick={saveProfile} disabled={savingProfile} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* Accounts */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Trading Accounts</h2>
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-lg border border-zinc-700 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">{acc.name}</span>
                    {acc.isDefault && <span className="rounded-full bg-indigo-600/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-400">Default</span>}
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{acc.type}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{acc.broker ?? "—"} · {acc.currency}</p>
                </div>
                <button onClick={() => deleteAccount(acc.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Add Account</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "name", label: "Name *", placeholder: "Exness Live" },
                { key: "broker", label: "Broker", placeholder: "Exness" },
                { key: "accountNumber", label: "Account #", placeholder: "12345678" },
                { key: "currency", label: "Currency", placeholder: "USD" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-400 mb-1">{label}</label>
                  <input
                    value={(newAccount as any)[key]}
                    onChange={(e) => setNewAccount((a) => ({ ...a, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Type</label>
                <select value={newAccount.type} onChange={(e) => setNewAccount((a) => ({ ...a, type: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                  <option value="LIVE">Live</option>
                  <option value="DEMO">Demo</option>
                  <option value="BACKTEST">Backtest</option>
                </select>
              </div>
            </div>
            <button onClick={createAccount} disabled={creatingAccount || !newAccount.name} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
              Add Account
            </button>
          </div>
        </div>
      )}

      {/* Tags */}
      {activeTab === "tags" && (
        <div className="space-y-4">
          {/* Setup Tags */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Setup Tags ({setupTags.length})</h2>
            <div className="space-y-1.5">
              {setupTags.map((t) =>
                editingSetupTag?.id === t.id ? (
                  <div key={t.id} className="flex items-center gap-2">
                    <input
                      value={editingSetupTag.name}
                      onChange={(e) => setEditingSetupTag((s) => s && { ...s, name: e.target.value })}
                      className="flex-1 rounded-lg border border-indigo-500 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={editingSetupTag.color}
                      onChange={(e) => setEditingSetupTag((s) => s && { ...s, color: e.target.value })}
                      className="h-8 w-8 rounded border border-zinc-700 bg-zinc-800 p-0.5 cursor-pointer"
                    />
                    <button onClick={saveSetupTag} className="rounded-lg bg-indigo-600 px-2 py-1.5 text-white hover:bg-indigo-500"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingSetupTag(null)} className="rounded-lg border border-zinc-700 px-2 py-1.5 text-zinc-400 hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 hover:border-zinc-700 transition-colors group">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: t.color + "22", color: t.color }}>
                      {t.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingSetupTag({ id: t.id, name: t.name, color: t.color })} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteSetupTag(t.id)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <input value={newSetupTag.name} onChange={(e) => setNewSetupTag((t) => ({ ...t, name: e.target.value }))} placeholder="New setup tag..." className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none" />
              <input type="color" value={newSetupTag.color} onChange={(e) => setNewSetupTag((t) => ({ ...t, color: e.target.value }))} className="h-10 w-10 rounded-lg border border-zinc-700 bg-zinc-800 p-0.5 cursor-pointer" />
              <button onClick={createSetupTag} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Mistake Tags */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Mistake Tags ({mistakeTags.length})</h2>
            <div className="space-y-1.5">
              {mistakeTags.map((t) =>
                editingMistakeTag?.id === t.id ? (
                  <div key={t.id} className="flex items-center gap-2">
                    <input
                      value={editingMistakeTag.name}
                      onChange={(e) => setEditingMistakeTag((s) => s && { ...s, name: e.target.value })}
                      className="flex-1 rounded-lg border border-red-500 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={editingMistakeTag.color}
                      onChange={(e) => setEditingMistakeTag((s) => s && { ...s, color: e.target.value })}
                      className="h-8 w-8 rounded border border-zinc-700 bg-zinc-800 p-0.5 cursor-pointer"
                    />
                    <button onClick={saveMistakeTag} className="rounded-lg bg-red-600 px-2 py-1.5 text-white hover:bg-red-500"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingMistakeTag(null)} className="rounded-lg border border-zinc-700 px-2 py-1.5 text-zinc-400 hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 hover:border-zinc-700 transition-colors group">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: t.color + "22", color: t.color }}>
                      ⚠ {t.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingMistakeTag({ id: t.id, name: t.name, color: t.color })} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteMistakeTag(t.id)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <input value={newMistakeTag.name} onChange={(e) => setNewMistakeTag((t) => ({ ...t, name: e.target.value }))} placeholder="New mistake tag..." className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none" />
              <input type="color" value={newMistakeTag.color} onChange={(e) => setNewMistakeTag((t) => ({ ...t, color: e.target.value }))} className="h-10 w-10 rounded-lg border border-zinc-700 bg-zinc-800 p-0.5 cursor-pointer" />
              <button onClick={createMistakeTag} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* MT5 Integration */}
      {activeTab === "mt5" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">MT5 Expert Advisor Integration</h2>
            <p className="text-sm text-zinc-400">
              Connect your MetaTrader 5 account to automatically sync trades in real-time using a custom Expert Advisor.
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border border-zinc-700 p-4">
                <p className="text-xs font-semibold text-zinc-300 mb-1">Step 1: Download &amp; place the EA</p>
                <p className="text-xs text-zinc-500 mb-2">Download the file, then copy it into your MT5 Experts folder: <span className="font-mono text-zinc-400">File → Open Data Folder → MQL5 → Experts</span></p>
                <a href="/mt5-ea/Tradezory_EA.mq5" download className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors">
                  ↓ Download Tradezory_EA.mq5
                </a>
              </div>
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4">
                <p className="text-xs font-semibold text-indigo-300 mb-1">Step 2: Compile in MetaEditor</p>
                <p className="text-xs text-zinc-400">In MT5 press <span className="font-mono bg-zinc-800 px-1 rounded">F4</span> to open MetaEditor. Open the file, then press <span className="font-mono bg-zinc-800 px-1 rounded">F7</span> to compile. Wait for <span className="text-emerald-400 font-medium">&quot;0 errors&quot;</span> in the Toolbox. Then back in MT5, right-click <strong>Expert Advisors</strong> in the Navigator and click <strong>Refresh</strong> — the EA will appear in the list.</p>
              </div>
              <div className="rounded-lg border border-zinc-700 p-4">
                <p className="text-xs font-semibold text-zinc-300 mb-1">Step 3: Configure the EA</p>
                <p className="text-xs text-zinc-500 mb-2">Set these parameters in the EA input settings:</p>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex gap-2"><span className="text-zinc-500 w-36">WebhookURL:</span><span className="text-indigo-400">{typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/api/mt5/webhook</span></div>
                  <div className="flex gap-2"><span className="text-zinc-500 w-36">AccountID:</span><span className="text-amber-400">{accounts[0]?.id ?? "your-account-id"}</span></div>
                  <div className="flex gap-2"><span className="text-zinc-500 w-36">HMACSecret:</span><span className="text-emerald-400">{mt5WebhookSecret || "contact support"}</span></div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-700 p-4">
                <p className="text-xs font-semibold text-zinc-300 mb-1">Step 4: Attach to Chart</p>
                <p className="text-xs text-zinc-500">Drag Tradezory_EA from the Navigator onto <strong>one</strong> chart. Enable <em>Allow WebRequests</em> and add your Tradezory URL in <span className="font-mono text-zinc-400">Tools → Options → Expert Advisors</span>.</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-400 font-medium mb-1">Alternative: MetaApi.cloud</p>
              <p className="text-xs text-zinc-400">For hands-off real-time sync without running an EA, connect via MetaApi.cloud (~$15-50/mo). Contact support for setup help.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
