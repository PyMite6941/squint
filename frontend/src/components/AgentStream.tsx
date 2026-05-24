import { useEffect, useRef } from "react";
import { Bot, Cpu, Wrench, Sparkles } from "lucide-react";

interface Props {
  logs: string[];
  running: boolean;
}

const AGENT_COLORS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "UI Screenshot Analyst": { label: "Analyst", color: "text-cyan-400", icon: <Bot className="w-3 h-3" /> },
  "Component Architect":   { label: "Architect", color: "text-violet-400", icon: <Cpu className="w-3 h-3" /> },
  "Frontend Code Generator": { label: "Generator", color: "text-emerald-400", icon: <Sparkles className="w-3 h-3" /> },
  "Code Output Cleaner":   { label: "Cleaner", color: "text-amber-400", icon: <Wrench className="w-3 h-3" /> },
};

function classifyLine(line: string): { type: "agent" | "task" | "tool" | "output" | "separator"; agentKey?: string } {
  for (const key of Object.keys(AGENT_COLORS)) {
    if (line.includes(key)) return { type: "agent", agentKey: key };
  }
  if (line.startsWith("## Task:") || line.startsWith("Starting Task:")) return { type: "task" };
  if (line.includes("screenshot_analyzer") || line.includes("Tool:") || line.includes("Using tool")) return { type: "tool" };
  if (line.startsWith("# Agent:") || line === "---" || line.startsWith("====")) return { type: "separator" };
  return { type: "output" };
}

function LogLine({ line }: { line: string }) {
  const { type, agentKey } = classifyLine(line);
  const clean = line.replace(/^#+\s*/, "").replace(/^={3,}/, "").replace(/^-{3,}/, "");

  if (type === "separator") return <div className="my-1 border-t border-white/5" />;

  if (type === "agent" && agentKey) {
    const agent = AGENT_COLORS[agentKey];
    return (
      <div className={`flex items-center gap-1.5 text-xs font-semibold mt-2 ${agent.color}`}>
        {agent.icon}
        <span>{agent.label}</span>
        <span className="text-white/20 font-normal">·</span>
        <span className="text-white/40 font-normal truncate">{clean.replace(agentKey, "").trim()}</span>
      </div>
    );
  }

  if (type === "task") {
    return (
      <div className="text-xs text-sky-300/80 font-medium mt-1.5 flex items-start gap-1.5">
        <span className="shrink-0 mt-px text-sky-500">▸</span>
        <span className="truncate">{clean}</span>
      </div>
    );
  }

  if (type === "tool") {
    return (
      <div className="text-xs text-amber-300/70 font-mono flex items-start gap-1.5 pl-2">
        <span className="shrink-0 text-amber-500/60">⚙</span>
        <span className="truncate">{line}</span>
      </div>
    );
  }

  return (
    <div className="text-xs text-white/35 font-mono pl-2 leading-relaxed truncate">
      {line}
    </div>
  );
}

export default function AgentStream({ logs, running }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0 && !running) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-indigo-400/60" />
        </div>
        <p className="text-xs text-white/25 max-w-44 leading-relaxed">
          Agent activity will appear here during conversion
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-0.5 scrollbar-thin">
      {logs.map((line, i) => (
        <LogLine key={i} line={line} />
      ))}
      {running && (
        <div className="flex items-center gap-1.5 text-xs text-indigo-400/60 mt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>Processing…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
