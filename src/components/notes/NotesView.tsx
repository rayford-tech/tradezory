"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Note } from "@/types";
import { Plus, FileText, X, Pencil, Trash2, Check } from "lucide-react";

const NOTE_TYPES = [
  { value: "PRE_MARKET", label: "Pre-Market" },
  { value: "POST_MARKET", label: "Post-Market" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "LESSON", label: "Lesson" },
] as const;

const typeColors: Record<string, string> = {
  PRE_MARKET: "#6366f1",
  POST_MARKET: "#10b981",
  WEEKLY: "#f59e0b",
  MONTHLY: "#ec4899",
  LESSON: "#06b6d4",
};

interface NotesViewProps {
  notes: Note[];
}

export function NotesView({ notes: initial }: NotesViewProps) {
  const [notes, setNotes] = useState(initial);
  const [filter, setFilter] = useState<string>("ALL");
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState<string>("PRE_MARKET");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ content: string; type: string }>({ content: "", type: "PRE_MARKET" });
  const [editSaving, setEditSaving] = useState(false);

  const filtered = filter === "ALL" ? notes : notes.filter((n) => n.type === filter);

  async function createNote() {
    if (!newContent.trim()) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, date: new Date().toISOString(), content: newContent.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setNotes((n) => [created, ...n]);
      setNewContent("");
      setNewType("PRE_MARKET");
      setShowNew(false);
    }
    setSaving(false);
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditForm({ content: note.content, type: note.type });
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editForm.content, type: editForm.type }),
    });
    if (res.ok) {
      setNotes((prev) =>
        prev.map((n) => n.id === id ? { ...n, content: editForm.content, type: editForm.type as Note["type"] } : n)
      );
      setEditingId(null);
    }
    setEditSaving(false);
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Notes</h1>
          <p className="text-sm text-zinc-400">Pre-market plans, post-market reviews & lessons</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Note
        </button>
      </div>

      {/* New note form */}
      {showNew && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">New Note</h2>
            <button onClick={() => setShowNew(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={6}
            placeholder="Write your note here... You can use markdown formatting."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none resize-none font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={createNote}
              disabled={saving || !newContent.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
            <button onClick={() => setShowNew(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === "ALL" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          All ({notes.length})
        </button>
        {NOTE_TYPES.map((t) => {
          const count = notes.filter((n) => n.type === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === t.value ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <FileText className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No notes yet</p>
          <p className="text-zinc-500 text-xs mt-1">Start journaling your pre-market plans and lessons</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => {
            const color = typeColors[note.type] ?? "#6366f1";
            const typeLabel = NOTE_TYPES.find((t) => t.value === note.type)?.label ?? note.type;
            const isEditing = editingId === note.id;

            return (
              <div key={note.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
                      >
                        {NOTE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: color + "22", color }}
                      >
                        {typeLabel}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {format(new Date(note.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(note.id)}
                          disabled={editSaving || !editForm.content.trim()}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                          <Check className="h-3 w-3" />
                          {editSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="Edit note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                    rows={6}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none resize-none font-mono"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
