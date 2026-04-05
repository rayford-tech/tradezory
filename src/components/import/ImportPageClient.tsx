"use client";

import { useState } from "react";
import { BrokerWizard } from "./BrokerWizard";
import { ImportView } from "./ImportView";
import { BrokerConnections } from "./BrokerConnections";
import type { TradingAccount } from "@/types";
import { RefreshCw, Upload } from "lucide-react";

type Tab = "broker" | "csv";

interface ImportPageClientProps {
  accounts: TradingAccount[];
  brokerConnections: any[];
}

export function ImportPageClient({ accounts, brokerConnections }: ImportPageClientProps) {
  const [tab, setTab] = useState<Tab>("broker");

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 max-w-xs">
        <button
          onClick={() => setTab("broker")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
            tab === "broker" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Broker Sync
        </button>
        <button
          onClick={() => setTab("csv")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
            tab === "csv" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          CSV Upload
        </button>
      </div>

      {/* Connected brokers (always visible) */}
      {brokerConnections.length > 0 && (
        <BrokerConnections connections={brokerConnections} />
      )}

      {/* Tab content */}
      {tab === "broker" ? (
        <BrokerWizard accounts={accounts} onFileUpload={() => setTab("csv")} />
      ) : (
        <ImportView accounts={accounts} />
      )}
    </div>
  );
}
