"use client";

import { useState } from "react";
import Link from "next/link";
import type { Playbook, SetupTag } from "@/types";
import { BookMarked, Plus, ChevronRight, Target, Check } from "lucide-react";
import { format } from "date-fns";

interface PlaybookListProps {
  playbooks: (Playbook & { setupTags: SetupTag[] })[];
}

export function PlaybookList({ playbooks }: PlaybookListProps) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function createPlaybook() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/playbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    if (res.ok) {
      const pb = await res.json();
      window.location.href = `/playbooks/${pb.id}`;
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Playbooks</h1>
          <p className="text-sm text-zinc-400">Your trading setup library</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Playbook
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200">Create Playbook</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. BOS Continuation"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button onClick={createPlaybook} disabled={loading || !name.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
              Create
            </button>
            <button onClick={() => setShowNew(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {playbooks.length === 0 && !showNew ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <BookMarked className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No playbooks yet</p>
          <p className="text-zinc-500 text-xs mt-1">Create your first trading setup playbook</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {playbooks.map((pb) => {
            const checklistItems = (pb.checklist as any[]) ?? [];
            const required = checklistItems.filter((c) => c.required).length;

            return (
              <Link key={pb.id} href={`/playbooks/${pb.id}`} className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-indigo-500/30 hover:bg-zinc-900 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/20">
                    <BookMarked className="h-4 w-4 text-indigo-400" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-indigo-400 transition-colors mt-1" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">{pb.name}</h3>
                {pb.description && <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{pb.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pb.timeframes.slice(0, 3).map((tf) => (
                    <span key={tf} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{tf}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {pb.targetRrMin ? `${pb.targetRrMin}–${pb.targetRrMax ?? "?"}R` : "No target set"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {required} rules
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
