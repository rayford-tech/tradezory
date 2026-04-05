"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";

const PREFS_KEY = "tf_notification_prefs";

interface NotifPrefs {
  dailyTradeReview: boolean;
  weeklyReviewReminder: boolean;
  importReminder: boolean;
  tagMistakesReminder: boolean;
  updatePlaybookNotes: boolean;
  monthlyReviewReminder: boolean;
}

const DEFAULT: NotifPrefs = {
  dailyTradeReview: true,
  weeklyReviewReminder: true,
  importReminder: false,
  tagMistakesReminder: true,
  updatePlaybookNotes: false,
  monthlyReviewReminder: true,
};

const ITEMS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  { key: "dailyTradeReview", label: "Daily trade review reminder", desc: "Remind you to review and tag today's trades before market close." },
  { key: "weeklyReviewReminder", label: "Weekly review reminder", desc: "Prompt to complete your weekly review every Friday evening." },
  { key: "monthlyReviewReminder", label: "Monthly review reminder", desc: "Prompt to complete your monthly performance review on the last day of each month." },
  { key: "importReminder", label: "Import reminder", desc: "Remind you to import your broker statement if no trades are logged this week." },
  { key: "tagMistakesReminder", label: "Tag mistakes reminder", desc: "Prompt to tag mistakes on closed trades that are still untagged." },
  { key: "updatePlaybookNotes", label: "Playbook notes reminder", desc: "Remind you to update playbook notes after a series of trades with that setup." },
];

export function NotificationsView() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
  }, []);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30">
          <Bell className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Notifications</h1>
          <p className="text-sm text-zinc-400">Manage your reminders and alerts</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400">
          Email & push notifications are coming soon. Preferences saved here will activate automatically when the notification system launches.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800">
        {ITEMS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              role="switch"
              aria-checked={prefs[key]}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                prefs[key] ? "bg-indigo-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  prefs[key] ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          Save preferences
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
