import { TrendingUp, BarChart3, Shield, BookOpen, Zap } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Track every trade",
    desc: "Log entries, exits, screenshots and notes in one place.",
  },
  {
    icon: BarChart3,
    title: "Analytics that reveal your edge",
    desc: "Win rate, profit factor, drawdown, session performance and more.",
  },
  {
    icon: BookOpen,
    title: "Build a playbook",
    desc: "Document setups and review your process like a professional.",
  },
  {
    icon: Shield,
    title: "Secure & private",
    desc: "Your trade data is encrypted and never shared.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-1/2 flex-col justify-between p-14 relative overflow-hidden border-r border-zinc-800/60">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-900/10 blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-50">Tradezory</span>
        </div>

        {/* Hero copy */}
        <div className="relative space-y-10">
          <div>
            <h2 className="text-4xl font-bold leading-tight text-zinc-50">
              Your trading journal,<br />
              <span className="text-indigo-400">engineered for growth.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Log trades, analyse patterns, and build the discipline that separates consistent traders from the rest.
            </p>
          </div>

          <ul className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/15 border border-indigo-500/20">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-zinc-600">© 2025 Tradezory · Built for serious traders.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-50">Tradezory</span>
        </div>

        {children}
      </div>
    </div>
  );
}
