import { useState, useEffect } from "react";
import { History, ChevronRight, Loader2 } from "lucide-react";
import { getHistory, type HistoryItem, type Framework } from "../lib/api";

interface Props {
  onSelect: (item: HistoryItem) => void;
  isPro: boolean;
}

const FRAMEWORK_LABELS: Record<Framework, string> = {
  html: "HTML",
  tailwind: "Tailwind",
  react: "React",
  vue: "Vue",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HistoryPanel({ onSelect, isPro }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !isPro) return;
    setLoading(true);
    getHistory()
      .then(setItems)
      .catch(() => setError("Couldn't load history."))
      .finally(() => setLoading(false));
  }, [open, isPro]);

  if (!isPro) {
    return (
      <button
        onClick={() => {}}
        className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-500 transition-colors"
        title="Upgrade to Pro for conversion history"
      >
        <History className="w-3.5 h-3.5" /> History (Pro)
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
      >
        <History className="w-3.5 h-3.5" /> History
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-72 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">Recent conversions</span>
            <button onClick={() => setOpen(false)} className="text-xs text-gray-600 hover:text-gray-400">✕</button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              </div>
            )}
            {error && <p className="text-xs text-red-400 px-4 py-4">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="text-xs text-gray-600 px-4 py-4">No conversions yet.</p>
            )}
            {!loading && items.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); setOpen(false); }}
                className="w-full text-left px-4 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-gray-400 truncate">
                    {item.code.split("\n")[0].slice(0, 40)}…
                  </span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-800 text-xs text-gray-500">
                    {FRAMEWORK_LABELS[item.framework]}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mt-1">{timeAgo(item.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
