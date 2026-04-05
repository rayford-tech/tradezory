"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  BookMarked,
  AlertTriangle,
  Calendar,
  FileText,
  Upload,
  Play,
  FlaskConical,
  Settings,
  TrendingUp,
  ChevronRight,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Playbooks", href: "/playbooks", icon: BookMarked },
  { label: "Mistakes", href: "/mistakes", icon: AlertTriangle },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Reviews", href: "/reviews/weekly", icon: FileText },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Replay", href: "/replay", icon: Play },
  { label: "Backtest", href: "/backtest", icon: FlaskConical },
  { label: "Import", href: "/import", icon: Upload },
];

const bottomItems = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/settings/billing", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-zinc-50">TradeForge</p>
          <p className="text-[10px] text-zinc-500 tracking-wider uppercase">Forge Your Edge</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-indigo-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-zinc-800 px-3 py-3">
        {bottomItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              pathname.startsWith(href)
                ? "bg-indigo-600/15 text-indigo-400"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
