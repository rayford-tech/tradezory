"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Playbook, SetupTag } from "@/types";
import { ArrowLeft, Save, Trash2, Plus, X, Check } from "lucide-react";

interface PlaybookDetailProps {
  playbook: Playbook & { setupTags: SetupTag[] };
  allSetupTags: SetupTag[];
}

export function PlaybookDetail({ playbook, allSetupTags }: PlaybookDetailProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: playbook.name,
    description: playbook.description ?? "",
    rules: playbook.rules ?? "",
    timeframes: playbook.timeframes.join(", "),
    entryConditions: playbook.entryConditions ?? "",
    invalidConditions: playbook.invalidConditions ?? "",
    targetRrMin: playbook.targetRrMin ? String(playbook.targetRrMin) : "",
    targetRrMax: playbook.targetRrMax ? String(playbook.targetRrMax) : "",
    notes: playbook.notes ?? "",
  });
  const [checklist, setChecklist] = useState<{ item: string; required: boolean }[]>(
    (playbook.checklist as any[]) ?? []
  );
  const [newCheckItem, setNewCheckItem] = useState("");

  async function save() {
    setSaving(true);
    await fetch(`/api/playbooks/${playbook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        timeframes: form.timeframes.split(",").map((t) => t.trim()).filter(Boolean),
        targetRrMin: form.targetRrMin ? parseFloat(form.targetRrMin) : null,
        targetRrMax: form.targetRrMax ? parseFloat(form.targetRrMax) : null,
        checklist,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  async function deletePlaybook() {
    if (!confirm("Delete this playbook?")) return;
    await fetch(`/api/playbooks/${playbook.id}`, { method: "DELETE" });
    router.push("/playbooks");
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { item: newCheckItem.trim(), required: false }]);
    setNewCheckItem("");
  }

  const F = ({ name, label, multiline = false, rows = 3, placeholder = "" }: { name: keyof typeof form; label: string; multiline?: boolean; rows?: number; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none resize-none"
        />
      ) : (
        <input
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/playbooks" className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-50">{playbook.name}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={deletePlaybook} className="flex items-center gap-1.5 rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <F name="name" label="Name" placeholder="Playbook name" />
        <F name="description" label="Description" multiline rows={2} placeholder="What is this setup?" />
        <F name="rules" label="Trading Rules" multiline rows={4} placeholder="1. Rule one&#10;2. Rule two" />
        <F name="timeframes" label="Timeframes (comma-separated)" placeholder="M15, H1, H4" />
        <div className="grid grid-cols-2 gap-4">
          <F name="targetRrMin" label="Min RR Target" placeholder="2.0" />
          <F name="targetRrMax" label="Max RR Target" placeholder="5.0" />
        </div>
        <F name="entryConditions" label="Valid Entry Conditions" multiline rows={3} placeholder="- Condition 1&#10;- Condition 2" />
        <F name="invalidConditions" label="Invalid Conditions (Skip trade if...)" multiline rows={2} placeholder="- Counter-trend&#10;- No clear structure" />
        <F name="notes" label="Notes" multiline rows={2} placeholder="Additional notes..." />
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Pre-Trade Checklist</h2>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                onClick={() => setChecklist(checklist.map((c, j) => j === i ? { ...c, required: !c.required } : c))}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${item.required ? "bg-indigo-600 border-indigo-500" : "border-zinc-600 hover:border-zinc-400"}`}
              >
                {item.required && <Check className="h-3 w-3 text-white" />}
              </button>
              <span className="flex-1 text-sm text-zinc-200">{item.item}</span>
              <span className="text-xs text-zinc-600">{item.required ? "Required" : "Optional"}</span>
              <button onClick={() => setChecklist(checklist.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCheckItem}
            onChange={(e) => setNewCheckItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
            placeholder="Add checklist item..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <button onClick={addCheckItem} className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-400 hover:text-zinc-200">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
