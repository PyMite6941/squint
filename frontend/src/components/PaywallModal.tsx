import { Zap, X } from "lucide-react";

const LEMON_URL = import.meta.env.VITE_LEMON_CHECKOUT_URL ?? "#";

interface Props {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Zap className="w-7 h-7 text-brand-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">You've used your 3 free conversions</h2>
            <p className="text-sm text-gray-400 mt-2">
              Upgrade to Pro for unlimited screenshots, all frameworks, and priority processing.
            </p>
          </div>

          <div className="w-full bg-gray-950 rounded-xl p-5 border border-gray-800 text-left space-y-2">
            {["Unlimited conversions", "React, Vue, Tailwind, HTML", "Priority Groq processing", "Early access to new features"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-brand-400">✓</span> {f}
              </div>
            ))}
          </div>

          <div className="w-full">
            <a
              href={LEMON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm text-center transition-colors shadow-lg shadow-brand-500/20"
            >
              Upgrade to Pro — $9/mo
            </a>
            <button onClick={onClose} className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors w-full">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
