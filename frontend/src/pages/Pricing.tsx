import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const LEMON_URL = import.meta.env.VITE_LEMON_CHECKOUT_URL ?? "#";

const FREE_FEATURES = ["3 total conversions", "HTML, Tailwind output", "Standard processing"];
const PRO_FEATURES = [
  "Unlimited conversions",
  "React (TSX) + Vue 3 output",
  "Priority Groq processing",
  "Early access to new features",
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
        <h1 className="text-4xl font-bold text-white text-center">Simple pricing</h1>
        <p className="text-gray-400 mt-3 text-center">Start free. Go Pro when you need more.</p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <div className="p-7 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col">
            <p className="text-sm font-medium text-gray-400">Free</p>
            <p className="mt-2 text-4xl font-bold text-white">$0</p>
            <p className="text-xs text-gray-600 mt-1">Forever</p>

            <ul className="mt-6 space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-gray-600 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <Link
              to="/app"
              className="mt-6 block py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium text-center hover:border-gray-500 hover:text-white transition-colors"
            >
              Start free
            </Link>
          </div>

          <div className="p-7 rounded-2xl bg-gray-900 border border-brand-500/40 ring-1 ring-brand-500/20 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-400">
              Pro
            </div>
            <p className="text-sm font-medium text-gray-400">Pro</p>
            <p className="mt-2 text-4xl font-bold text-white">$9</p>
            <p className="text-xs text-gray-600 mt-1">per month</p>

            <ul className="mt-6 space-y-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-brand-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <a
              href={LEMON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold text-center transition-colors shadow-lg shadow-brand-500/20"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800/60 py-6 text-center text-xs text-gray-700 space-x-4">
        <Link to="/terms" className="hover:text-gray-500 transition-colors">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-gray-500 transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
