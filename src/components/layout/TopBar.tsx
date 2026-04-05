"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const initial = session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm text-zinc-400">
          Welcome back,{" "}
          <span className="font-medium text-zinc-100">
            {session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Trader"}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/settings/notifications" className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
          <Bell className="h-4 w-4" />
        </Link>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initial}
            </div>
            <span className="text-sm text-zinc-300 hidden sm:block">
              {session?.user?.name ?? session?.user?.email?.split("@")[0]}
            </span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-xs text-zinc-500 truncate">{session?.user?.email}</p>
                </div>
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
