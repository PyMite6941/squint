import { useState, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Loader2, Wand2 } from "lucide-react";
import UploadZone from "../components/UploadZone";
import FrameworkPicker from "../components/FrameworkPicker";
import AgentStream from "../components/AgentStream";
import { convertScreenshot, ConvertError, type Framework } from "../lib/api";
const CodeViewer = lazy(() => import("../components/CodeViewer"));

export default function AppPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>("react");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setCode(null);
    setError(null);
    setLogs([]);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setCode(null);
    setLogs([]);

    try {
      const result = await convertScreenshot(file, framework, (line) =>
        setLogs((prev) => [...prev, line])
      );
      setCode(result.code);
    } catch (err) {
      setError(err instanceof ConvertError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 px-5 py-3.5 flex items-center justify-between">
        <Link to="/" className="text-base font-bold text-white tracking-tight">
          squint<span className="text-brand-500">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Pricing</Link>
          <Link to="/docs" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Docs</Link>
        </div>
      </nav>

      {/* 3-column layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_420px] overflow-hidden h-[calc(100vh-57px)]">

        {/* Left — upload + controls */}
        <aside className="border-r border-gray-800/60 flex flex-col gap-4 p-5 overflow-y-auto">
          <div>
            <h1 className="text-base font-semibold text-white">Convert screenshot</h1>
            <p className="text-xs text-gray-500 mt-0.5">Drop any UI and get clean code back.</p>
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
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 mt-auto"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</>
              : <><Wand2 className="w-4 h-4" /> Convert to code</>}
          </button>
        </aside>

        {/* Center — agent stream */}
        <section className="border-r border-gray-800/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              loading ? "bg-emerald-400 animate-pulse" : logs.length > 0 ? "bg-gray-600" : "bg-gray-800"
            }`} />
            <span className="text-xs font-medium text-gray-400">Agent activity</span>
            {logs.length > 0 && !loading && (
              <button
                onClick={() => setLogs([])}
                className="ml-auto text-xs text-gray-700 hover:text-gray-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <AgentStream logs={logs} running={loading} />
          </div>
        </section>

        {/* Right — code output */}
        <section className="flex flex-col overflow-hidden p-4 gap-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Output</span>
          <div className="flex-1 overflow-hidden">
            {loading && !code ? (
              <LoadingSkeleton />
            ) : code ? (
              <Suspense fallback={<LoadingSkeleton />}>
                <CodeViewer code={code} framework={framework} />
              </Suspense>
            ) : (
              <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 gap-3 p-8 text-center">
                <Wand2 className="w-8 h-8 text-gray-800" />
                <p className="text-xs text-gray-700">Upload a screenshot and click Convert</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
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
