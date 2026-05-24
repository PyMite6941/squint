import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Loader2, Wand2, LogOut, History, X, ChevronDown } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import UploadZone from "../components/UploadZone";
import FrameworkPicker from "../components/FrameworkPicker";
import AgentStream from "../components/AgentStream";
import PaywallModal from "../components/PaywallModal";
const CodeViewer = lazy(() => import("../components/CodeViewer"));
import {
  convertScreenshot,
  getUsage,
  getHistory,
  PaywallError,
  AuthError,
  type Framework,
  type HistoryItem,
} from "../lib/api";
import { supabase, signInWithMagicLink, signOut } from "../lib/supabase";

export default function AppPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>("react");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    getUsage().then((u) => {
      setRemaining(u.remaining);
      setIsPro(u.tier === "paid");
    }).catch(() => {});
  }, [session]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithMagicLink(authEmail);
      setAuthSent(true);
    } catch {
      setError("Failed to send magic link. Check your email address.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setCode(null);
    setError(null);
    setLogs([]);
    setPreview(URL.createObjectURL(f));
  }, []);

  const loadHistory = async () => {
    try {
      const items = await getHistory();
      setHistory(items);
      setShowHistory(true);
    } catch {}
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setCode(item.code);
    setFramework(item.framework);
    setShowHistory(false);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setCode(null);
    setLogs([]);

    try {
      const result = await convertScreenshot(file, framework, (line) => {
        setLogs((prev) => [...prev, line]);
      });
      setCode(result.code);
      setRemaining(result.remaining);
    } catch (err) {
      if (err instanceof PaywallError) {
        setShowPaywall(true);
      } else if (err instanceof AuthError) {
        setError("Session expired. Please sign in again.");
        setSession(null);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Nav session={null} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-5 h-5 text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Sign in to Squint</h1>
            <p className="text-sm text-gray-500 mt-2 text-center">We'll email you a magic link — no password needed.</p>

            {authSent ? (
              <div className="mt-8 p-5 rounded-xl bg-gray-900 border border-gray-800 text-center">
                <p className="text-sm text-gray-300">
                  Check <span className="text-white font-medium">{authEmail}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">Click the link to sign in.</p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="mt-8 flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                >
                  {authLoading ? "Sending…" : "Send magic link"}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Nav session={session} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_420px] gap-0 overflow-hidden h-[calc(100vh-57px)]">
        {/* Left: Controls */}
        <aside className="border-r border-gray-800/60 flex flex-col gap-4 p-5 overflow-y-auto">
          <div>
            <h1 className="text-base font-semibold text-white">Convert screenshot</h1>
            <p className="text-xs text-gray-500 mt-0.5">Upload any UI and get clean code back.</p>
          </div>

          <UploadZone onFile={handleFile} preview={preview} disabled={loading} />

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Output format</p>
            <FrameworkPicker value={framework} onChange={setFramework} />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!file || loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</>
              : <><Wand2 className="w-4 h-4" /> Convert to code</>}
          </button>

          <div className="flex items-center justify-between mt-auto">
            {remaining !== null && (
              <p className="text-xs text-gray-600">
                {remaining === 0
                  ? "Limit reached."
                  : `${remaining} left ${isPro ? "this month" : "today"}`}
              </p>
            )}
            {isPro ? (
              <button
                onClick={loadHistory}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
              >
                <History className="w-3.5 h-3.5" /> History
                <ChevronDown className="w-3 h-3" />
              </button>
            ) : (
              <Link to="/pricing" className="text-xs text-brand-500 hover:underline ml-auto">
                Upgrade →
              </Link>
            )}
          </div>
        </aside>

        {/* Center: Agent Stream */}
        <section className="border-r border-gray-800/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-emerald-400 animate-pulse" : logs.length > 0 ? "bg-gray-600" : "bg-gray-800"}`} />
              <span className="text-xs font-medium text-gray-400">Agent activity</span>
            </div>
            {logs.length > 0 && (
              <button onClick={() => setLogs([])} className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <AgentStream logs={logs} running={loading} />
          </div>
        </section>

        {/* Right: Code Output */}
        <section className="flex flex-col overflow-hidden p-4 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Output</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading && !code ? (
              <LoadingSkeleton />
            ) : code ? (
              <Suspense fallback={<LoadingSkeleton />}>
                <CodeViewer code={code} framework={framework} />
              </Suspense>
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 gap-3 p-8 text-center">
                <Wand2 className="w-8 h-8 text-gray-800" />
                <p className="text-xs text-gray-700">Upload a screenshot and click Convert</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* History drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowHistory(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-gray-900 border-l border-gray-800 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <span className="text-sm font-semibold text-white">Conversion history</span>
              <button onClick={() => setShowHistory(false)} className="text-gray-600 hover:text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-gray-600 p-4 text-center">No history yet.</p>
              ) : history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistorySelect(item)}
                  className="w-full text-left p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-300 uppercase">{item.framework}</span>
                    <span className="text-xs text-gray-600">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono truncate">{item.code.slice(0, 60)}…</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </div>
  );
}

function Nav({ session }: { session: Session | null }) {
  return (
    <nav className="border-b border-gray-800/60 px-5 py-3.5 flex items-center justify-between">
      <Link to="/" className="text-base font-bold text-white tracking-tight">
        squint<span className="text-brand-500">.</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Pricing</Link>
        <Link to="/docs" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Docs</Link>
        {session && (
          <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        )}
      </div>
    </nav>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden animate-pulse h-full">
      <div className="h-10 bg-gray-900 border-b border-gray-800" />
      <div className="p-4 space-y-2.5">
        {[80, 60, 90, 50, 70, 40, 85, 55, 65, 45].map((w, i) => (
          <div key={i} className="h-3 rounded bg-gray-800" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
