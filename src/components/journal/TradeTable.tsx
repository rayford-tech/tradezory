"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import type { TradeWithRelations, TradingAccount, SetupTag, MistakeTag } from "@/types";
import { ArrowUpRight, ArrowDownRight, Search, Filter, Image } from "lucide-react";

interface TradeTableProps {
  trades: TradeWithRelations[];
  accounts: TradingAccount[];
  setupTags: SetupTag[];
  mistakeTags: MistakeTag[];
}

type SortKey = "openTime" | "instrument" | "netPnl" | "rrRatio" | "status";
type SortDir = "asc" | "desc";

export function TradeTable({ trades, accounts, setupTags, mistakeTags }: TradeTableProps) {
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("openTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = trades.filter((t) => {
      if (search && !t.instrument.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAccount && t.accountId !== filterAccount) return false;
      if (filterDirection && t.direction !== filterDirection) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterSession && t.session !== filterSession) return false;
      return true;
    });

    result.sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === "openTime") { va = new Date(a.openTime).getTime(); vb = new Date(b.openTime).getTime(); }
      else if (sortKey === "instrument") { va = a.instrument; vb = b.instrument; }
      else if (sortKey === "netPnl") { va = Number(a.netPnl ?? 0); vb = Number(b.netPnl ?? 0); }
      else if (sortKey === "rrRatio") { va = Number(a.rrRatio ?? 0); vb = Number(b.rrRatio ?? 0); }
      else if (sortKey === "status") { va = a.status; vb = b.status; }
      else { va = 0; vb = 0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, search, filterAccount, filterDirection, filterStatus, filterSession, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-1 text-indigo-400">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instrument..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Direction</option>
          <option value="BUY">Long</option>
          <option value="SELL">Short</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Session</option>
          <option value="ASIAN">Asian</option>
          <option value="LONDON">London</option>
          <option value="NEW_YORK">New York</option>
          <option value="LONDON_NY_OVERLAP">London/NY</option>
        </select>
        <div className="text-xs text-zinc-500 self-center">
          {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {[
                { key: "openTime" as SortKey, label: "Date" },
                { key: "instrument" as SortKey, label: "Instrument" },
                { key: null, label: "Direction" },
                { key: null, label: "Entry" },
                { key: "netPnl" as SortKey, label: "P&L" },
                { key: "rrRatio" as SortKey, label: "RR" },
                { key: null, label: "Session" },
                { key: null, label: "Tags" },
                { key: "status" as SortKey, label: "Status" },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  onClick={() => key && toggleSort(key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap ${key ? "cursor-pointer hover:text-zinc-300" : ""}`}
                >
                  {label}
                  {key && <SortIcon k={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-500 text-sm">
                  No trades found
                </td>
              </tr>
            ) : (
              filtered.map((trade) => {
                const pnl = Number(trade.netPnl ?? 0);
                const isOpen = trade.status === "OPEN";
                const setupTags = trade.tradeTags.filter((t) => t.setupTag).map((t) => t.setupTag!);
                const mistakeTags = trade.tradeTags.filter((t) => t.mistakeTag).map((t) => t.mistakeTag!);

                return (
                  <tr key={trade.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {format(new Date(trade.openTime), "MMM d, HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/journal/${trade.id}`}
                        className="font-medium text-zinc-100 hover:text-indigo-400 transition-colors flex items-center gap-1"
                      >
                        {trade.instrument}
                        {trade.screenshots.length > 0 && <Image className="h-3 w-3 text-zinc-500" />}
                      </Link>
                      <p className="text-xs text-zinc-500">{trade.account.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${trade.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                        {trade.direction === "BUY" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                      {Number(trade.entryPrice).toFixed(5)}
                    </td>
                    <td className="px-4 py-3">
                      {isOpen ? (
                        <span className="text-zinc-500 text-xs">Open</span>
                      ) : (
                        <span className={`font-medium ${pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-zinc-400"}`}>
                          {formatCurrency(pnl)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {trade.rrRatio ? `${Number(trade.rrRatio).toFixed(2)}R` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {trade.session
                        ? { ASIAN: "Asian", LONDON: "London", NEW_YORK: "NY", LONDON_NY_OVERLAP: "Ldn/NY" }[trade.session] ?? trade.session
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {setupTags.slice(0, 2).map((tag) => (
                          <span key={tag.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tag.color + "22", color: tag.color }}>
                            {tag.name}
                          </span>
                        ))}
                        {mistakeTags.slice(0, 1).map((tag) => (
                          <span key={tag.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tag.color + "22", color: tag.color }}>
                            ⚠ {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                        isOpen
                          ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                          : pnl > 0
                          ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                          : pnl < 0
                          ? "bg-red-500/10 text-red-400 ring-red-500/20"
                          : "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                      }`}>
                        {isOpen ? "OPEN" : pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
