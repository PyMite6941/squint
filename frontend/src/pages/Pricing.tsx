import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const FEATURES = [
  "Unlimited conversions",
  "HTML, Tailwind, React, Vue 3 output",
  "4-agent CrewAI pipeline",
  "Live agent activity stream",
  "No sign-in required",
  "Free forever",
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link to="/" className="text-lg font-bold text-white tracking-tight">
          squint<span className="text-brand-500">.</span>
        </Link>
        <Link to="/app" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
          App
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <h1 className="text-4xl font-bold text-white text-center">Completely free</h1>
        <p className="text-gray-400 mt-3 text-center max-w-sm">
          No account. No limits. No credit card. Squint is an open-source portfolio project — use it as much as you want.
        </p>

        <div className="mt-12 w-full max-w-sm">
          <div className="p-8 rounded-2xl bg-gray-900 border border-brand-500/40 ring-1 ring-brand-500/20 flex flex-col">
            <p className="text-sm font-medium text-gray-400">Everything included</p>
            <p className="mt-2 text-4xl font-bold text-white">$0</p>
            <p className="text-xs text-gray-600 mt-1">No strings attached</p>

            <ul className="mt-6 space-y-3 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-brand-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <Link
              to="/app"
              className="mt-6 block py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold text-center transition-colors shadow-lg shadow-brand-500/20"
            >
              Start converting
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
