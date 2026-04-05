"use client";

import { useState } from "react";
import { RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2, Clock, XCircle, Wifi } from "lucide-react";
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
  tradingAccount?: { name: string; type: string } | null;
  createdAt: string;
}

interface BrokerConnectionsProps {
  connections: Connection[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    ACTIVE: { icon: <CheckCircle className="h-3 w-3" />, label: "Active", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    CONNECTING: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Connecting", cls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
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

export function BrokerConnections({ connections: initial }: BrokerConnectionsProps) {
  const [connections, setConnections] = useState(initial);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});

  async function syncConnection(id: string) {
    setSyncing((s) => ({ ...s, [id]: true }));
    setSyncResults((r) => ({ ...r, [id]: "" }));
    const res = await fetch(`/api/broker-connections/${id}/sync`, { method: "POST" });
    const data = await res.json();
    setSyncing((s) => ({ ...s, [id]: false }));

    if (res.ok) {
      setSyncResults((r) => ({ ...r, [id]: `✓ ${data.imported} imported, ${data.skipped} skipped` }));
      // Refresh connection status
      const connRes = await fetch("/api/broker-connections");
      if (connRes.ok) setConnections(await connRes.json());
    } else {
      setSyncResults((r) => ({ ...r, [id]: `✗ ${data.error}` }));
    }
  }

  async function deleteConnection(id: string) {
    if (!confirm("Remove this broker connection?")) return;
    await fetch(`/api/broker-connections/${id}`, { method: "DELETE" });
    setConnections((c) => c.filter((x) => x.id !== id));
  }

  if (connections.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <Wifi className="h-4 w-4 text-indigo-400" />
        Connected Brokers
      </h2>
      {connections.map((conn) => (
        <div key={conn.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-start justify-between gap-3">
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
              {conn.status === "ERROR" && conn.lastError && (
                <p className="mt-1.5 text-[10px] text-red-400 bg-red-500/5 border border-red-500/10 rounded px-2 py-1">
                  {conn.lastError}
                </p>
              )}
              {syncResults[conn.id] && (
                <p className={`mt-1.5 text-[10px] rounded px-2 py-1 ${syncResults[conn.id].startsWith("✓") ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10" : "text-red-400 bg-red-500/5 border border-red-500/10"}`}>
                  {syncResults[conn.id]}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => syncConnection(conn.id)}
                disabled={!!syncing[conn.id]}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-50 transition-colors"
              >
                {syncing[conn.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Sync
              </button>
              <button
                onClick={() => deleteConnection(conn.id)}
                className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
