"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { Review } from "@/types";
import { Plus, Star, X, Sparkles, Loader2 } from "lucide-react";

interface ReviewsViewProps {
  type: "WEEKLY" | "MONTHLY";
  reviews: Review[];
}

const FIELDS = [
  { key: "summary", label: "Summary", rows: 3, placeholder: "How did this period go overall?" },
  { key: "improvements", label: "What to Improve", rows: 3, placeholder: "- Area 1\n- Area 2" },
  { key: "lessons", label: "Key Lessons", rows: 3, placeholder: "What did you learn?" },
  { key: "goals", label: "Goals for Next Period", rows: 2, placeholder: "- Goal 1\n- Goal 2" },
] as const;

export function ReviewsView({ type, reviews }: ReviewsViewProps) {
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    summary: "",
    improvements: "",
    lessons: "",
    goals: "",
    score: "",
  });

  const now = new Date();
  const defaultStart =
    type === "WEEKLY" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const defaultEnd =
    type === "WEEKLY" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

  async function generateWithAI() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          periodStart: defaultStart.toISOString(),
          periodEnd: defaultEnd.toISOString(),
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setForm((f) => ({
        ...f,
        summary: data.summary ?? f.summary,
        improvements: data.improvements ?? f.improvements,
        lessons: data.lessons ?? f.lessons,
        goals: data.goals ?? f.goals,
      }));
    } finally {
      setGenerating(false);
    }
  }

  async function createReview() {
    setSaving(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        periodStart: defaultStart.toISOString(),
        periodEnd: defaultEnd.toISOString(),
        summary: form.summary || null,
        improvements: form.improvements || null,
        lessons: form.lessons || null,
        goals: form.goals || null,
        score: form.score ? parseInt(form.score) : null,
      }),
    });
    setSaving(false);
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">
            {type === "WEEKLY" ? "Weekly" : "Monthly"} Reviews
          </h1>
          <p className="text-sm text-zinc-400">Reflect, improve, and set goals</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Review
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              {type === "WEEKLY"
                ? `Week of ${format(defaultStart, "MMM d")}–${format(defaultEnd, "MMM d, yyyy")}`
                : format(now, "MMMM yyyy")}
            </h2>
            <button onClick={() => setShowNew(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          {FIELDS.map(({ key, label, rows, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
              <textarea
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                rows={rows}
                placeholder={placeholder}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Overall Score (1–10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              placeholder="7"
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={createReview}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Review"}
            </button>
            <button
              onClick={generateWithAI}
              disabled={generating}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-60 transition-colors"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
              {generating ? "Generating..." : "Generate with AI"}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !showNew ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <p className="text-zinc-400 text-sm">No reviews yet</p>
          <p className="text-zinc-500 text-xs mt-1">
            Regular reviews are the fastest path to consistent improvement
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">
                    {type === "WEEKLY"
                      ? `Week of ${format(new Date(review.periodStart), "MMM d")}–${format(new Date(review.periodEnd), "MMM d, yyyy")}`
                      : format(new Date(review.periodStart), "MMMM yyyy")}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {format(new Date(review.createdAt), "Written MMM d, yyyy")}
                  </p>
                </div>
                {review.score && (
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{review.score}/10</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {review.summary && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Summary</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{review.summary}</p>
                  </div>
                )}
                {review.improvements && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Improvements</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{review.improvements}</p>
                  </div>
                )}
                {review.lessons && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Lessons</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{review.lessons}</p>
                  </div>
                )}
                {review.goals && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Goals</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{review.goals}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
