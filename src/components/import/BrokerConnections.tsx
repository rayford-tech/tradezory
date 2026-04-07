"use client";

import { useState } from "react";
import { Download, Trash2, CheckCircle, AlertCircle, Clock, XCircle, Wifi, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Connection {
  id: string;
  platform: string;
  brokerName: string;
  server: string;
  login: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  tradesImported: number;
  tradingAccount?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

interface BrokerConnectionsProps {
  connections: Connection[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    ACTIVE: { icon: <CheckCircle className="h-3 w-3" />, label: "Active", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    CONNECTING: { icon: <Clock className="h-3 w-3" />, label: "Connecting", cls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    PENDING: { icon: <Clock className="h-3 w-3" />, label: "Pending", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    ERROR: { icon: <AlertCircle className="h-3 w-3" />, label: "Error", cls: "text-red-400 bg-red-500/10 border-red-500/20" },
    DISCONNECTED: { icon: <XCircle className="h-3 w-3" />, label: "Disconnected", cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

const EA_STEPS = [
  "Download the Tradezory_EA.mq5 file below",
  "Open MetaTrader 5 → File → Open Data Folder → MQL5 → Experts",
  "Copy the EA file there, then restart MetaTrader",
  "Attach the EA to any chart — it will push trades to Tradezory in real time",
];

export function BrokerConnections({ connections: initial }: BrokerConnectionsProps) {
  const [connections, setConnections] = useState(initial);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpanded(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  async function deleteConnection(id: string) {
    if (!confirm("Remove this broker connection?")) return;
    await fetch(`/api/broker-connections/${id}`, { method: "DELETE" });
    setConnections((c) => c.filter((x) => x.id !== id));
  }

  async function clearTradeData(conn: Connection) {
    if (!conn.tradingAccount) return;
    if (!confirm(`Delete ALL trades for "${conn.tradingAccount.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/accounts/${conn.tradingAccount.id}/trades`, { method: "DELETE" });
    if (res.ok) {
      const { deleted } = await res.json();
      setConnections((c) =>
        c.map((x) => x.id === conn.id ? { ...x, tradesImported: 0 } : x)
      );
      alert(`Cleared ${deleted} trade${deleted !== 1 ? "s" : ""}.`);
    }
  }

  if (connections.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <Wifi className="h-4 w-4 text-indigo-400" />
        Connected Brokers
      </h2>
      {connections.map((conn) => (
        <div key={conn.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-100">{conn.brokerName}</span>
                <StatusBadge status={conn.status} />
                <span className="text-[10px] rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">{conn.platform}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                <span>Server: <span className="text-zinc-400">{conn.server}</span></span>
                <span>·</span>
                <span>Login: <span className="text-zinc-400">{conn.login}</span></span>
                {conn.tradingAccount && (
                  <>
                    <span>·</span>
                    <span>Account: <span className="text-zinc-400">{conn.tradingAccount.name}</span></span>
                  </>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-600">
                <span>{conn.tradesImported} trades imported</span>
                {conn.lastSyncAt && (
                  <><span>·</span><span>Last sync {formatDistanceToNow(new Date(conn.lastSyncAt))} ago</span></>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleExpanded(conn.id)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              >
                EA Setup
                {expanded[conn.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                onClick={() => deleteConnection(conn.id)}
                className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* EA instructions panel */}
          {expanded[conn.id] && (
            <div className="border-t border-zinc-800 px-4 pb-4 pt-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-300">
                Trades sync automatically via the Tradezory MT5 Expert Advisor
              </p>
              <ol className="space-y-2">
                {EA_STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[9px] text-zinc-400 font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/mt5-ea/Tradezory_EA.mq5"
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Tradezory_EA.mq5
                </a>
                {conn.tradingAccount && (
                  <button
                    onClick={() => clearTradeData(conn)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Trade Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
