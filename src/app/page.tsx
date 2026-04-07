import Link from "next/link";
import { Zap, BarChart3, BookOpen, Target, Shield, TrendingUp, Play, BookMarked } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Trade Journal", desc: "Log every trade with full detail — entry, exit, SL/TP, screenshots, emotions, and execution scores." },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Win rate, profit factor, expectancy, drawdown, and 20+ metrics updated automatically." },
  { icon: BookMarked, title: "Playbooks", desc: "Build a library of your trading setups with rules, checklists, and performance tracking." },
  { icon: Shield, title: "Mistake Tracker", desc: "Tag and review mistakes. Understand your psychology patterns and eliminate costly habits." },
  { icon: Play, title: "Trade Replay", desc: "Step through your trades screenshot by screenshot. Review decisions and improve execution." },
  { icon: TrendingUp, title: "MT5 Integration", desc: "Import from CSV or connect your MetaTrader 5 account with our free Expert Advisor." },
];

const stats = [
  { value: "20+", label: "Analytics Metrics" },
  { value: "Real-time", label: "MT5 Sync" },
  { value: "100%", label: "Data Ownership" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">Tradezory</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-400">
            <Zap className="h-3 w-3" />
            The professional trading journal for serious traders
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-50 mb-6">
            Forge Your
            <span className="text-indigo-400"> Trading Edge</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tradezory is the all-in-one trading journal and analytics platform that helps you log trades,
            review performance, track mistakes, and build consistent profitability — like a fitness tracker for your trading.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 px-8 py-3.5 text-base font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Try demo account
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-600">Demo: demo@tradezory.io / demo1234</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 bg-zinc-900/40 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-indigo-400">{value}</p>
                <p className="text-sm text-zinc-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-50 mb-4">Everything you need to trade better</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              A complete ecosystem for tracking, reviewing, and improving your trading performance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-indigo-500/30 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/20 mb-4">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MT5 Section */}
      <section className="py-24 px-6 border-t border-zinc-800">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 md:p-12">
            <div className="md:flex items-center gap-8">
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">MT5 Integration</p>
                <h2 className="text-2xl font-bold text-zinc-50 mb-3">Connect your MetaTrader 5 account</h2>
                <p className="text-zinc-400 mb-4">
                  Three ways to import your MT5 trades:
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">1.</span>
                    <span><strong>Free EA (recommended):</strong> Download our MQL5 Expert Advisor — fires trades to Tradezory in real-time via webhook.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">2.</span>
                    <span><strong>CSV Import:</strong> Export your MT5 history report and upload with one click using our pre-built column mapping.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">3.</span>
                    <span><strong>MetaApi.cloud:</strong> Cloud-based sync — no EA needed, real-time, works even when MT5 is offline.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 md:mt-0 md:w-48 text-center">
                <Link
                  href="/signup"
                  className="block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Get started free
                </Link>
                <p className="text-xs text-zinc-500 mt-2">No credit card required</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-zinc-50 mb-4">Ready to forge your edge?</h2>
          <p className="text-zinc-400 mb-8">Join traders who use Tradezory to turn data into consistent profitability.</p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-indigo-600 px-10 py-4 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
          >
            Start journaling for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-bold text-zinc-400">Tradezory</span>
          </div>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Tradezory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
