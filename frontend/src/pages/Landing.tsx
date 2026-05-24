import { Link } from "react-router-dom";
import { ArrowRight, Zap, Code2, Layers, Eye, Download, History, Bot, Cpu, Sparkles } from "lucide-react";

const STEPS = [
  { n: "1", title: "Drop a screenshot", desc: "Drag in any UI screenshot — mockup, live site, Figma export. PNG, JPG, or WebP." },
  { n: "2", title: "Watch the agents work", desc: "A 4-agent CrewAI pipeline analyzes the UI, architects the components, generates and polishes the code." },
  { n: "3", title: "Paste and ship", desc: "Copy the component, paste it into your project. No cleanup, no rewiring — it just works." },
];

const AGENTS = [
  { icon: <Bot className="w-4 h-4" />, name: "UI Analyst", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", desc: "Reads the screenshot using Groq's vision model and maps every layout detail." },
  { icon: <Cpu className="w-4 h-4" />, name: "Architect", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", desc: "Plans the component name, imports, state, and JSX hierarchy before writing a line." },
  { icon: <Sparkles className="w-4 h-4" />, name: "Generator", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", desc: "Writes the complete React + Tailwind component from the blueprint." },
  { icon: <Code2 className="w-4 h-4" />, name: "Polisher", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", desc: "Strips markdown fences and preamble so you get clean, paste-ready source." },
];

const FEATURES = [
  { icon: <Zap className="w-4 h-4 text-brand-400" />, title: "4-agent pipeline", desc: "CrewAI orchestrates specialized agents — analyst, architect, generator, polisher — for higher-quality output than a single LLM call." },
  { icon: <Eye className="w-4 h-4 text-brand-400" />, title: "Live agent stream", desc: "Watch each agent think in real-time. See tool calls, task transitions, and model outputs as they happen." },
  { icon: <Code2 className="w-4 h-4 text-brand-400" />, title: "Semantic, clean code", desc: "Proper HTML elements, Tailwind utility classes, lucide-react icons. Code you'd actually write." },
  { icon: <Layers className="w-4 h-4 text-brand-400" />, title: "Four output formats", desc: "React TSX, Vue 3 SFC, Tailwind HTML, or plain HTML/CSS — whichever your project needs." },
  { icon: <Download className="w-4 h-4 text-brand-400" />, title: "Download or copy", desc: "One click to copy to clipboard or download the file directly. Works with VS Code, Cursor, everything." },
  { icon: <History className="w-4 h-4 text-brand-400" />, title: "Conversion history", desc: "Pro users get a full history of past conversions. Come back to anything you've ever generated." },
];

const FAQ = [
  { q: "How accurate is the output?", a: "On simple UIs — login forms, hero sections, pricing cards, nav bars — the output is paste-ready ~80% of the time. Complex dashboards with charts or dense data tables may need minor adjustments." },
  { q: "What frameworks does it support?", a: "React (TypeScript), Vue 3 (SFC), Tailwind HTML, and plain HTML/CSS. React is the highest-quality output since the agents were tuned primarily for it." },
  { q: "What is CrewAI?", a: "CrewAI is an open-source multi-agent orchestration framework. Instead of one model doing everything, specialized agents collaborate — each with a clear role and tools. Squint uses it to break screenshot conversion into focused steps." },
  { q: "Does it work with Figma screenshots?", a: "Yes. Export a frame as PNG and upload it. It works best with real browser screenshots or clean Figma exports — low-res or heavily compressed images produce weaker results." },
  { q: "What counts as a conversion?", a: "One screenshot upload = one conversion. Free tier gets 3 per day. Pro gets 200 per month." },
  { q: "Is my data private?", a: "Screenshots are sent to Groq for vision analysis and are not stored by us. We only store your account info and usage count in Supabase." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-lg font-bold text-white tracking-tight">
          squint<span className="text-brand-500">.</span>
        </span>
        <div className="flex items-center gap-6">
          <Link to="/pricing" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Pricing</Link>
          <Link to="/docs" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Docs</Link>
          <Link to="/app" className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
            Try free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-28 text-center max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-400 mb-8">
          <Zap className="w-3 h-3" /> CrewAI + Groq Vision + OpenRouter
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight">
          Screenshot in.<br />
          Production code out.<br />
          <span className="text-brand-400">Agents do the work.</span>
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
          A 4-agent CrewAI pipeline analyzes your UI screenshot, plans the component structure,
          writes clean React + Tailwind code, and polishes the output — all while you watch.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center">
          <Link
            to="/app"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-all shadow-lg shadow-brand-500/20 text-sm"
          >
            Try free — 3/day <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3.5 rounded-xl border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 font-medium transition-all text-sm"
          >
            See pricing
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-700">No credit card required. 3 free conversions per day, forever.</p>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto w-full px-4 py-16 border-t border-gray-800/60">
        <h2 className="text-2xl font-bold text-white text-center">How it works</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-400">
                {s.n}
              </div>
              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent pipeline */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16 border-t border-gray-800/60">
        <h2 className="text-2xl font-bold text-white text-center">The agent pipeline</h2>
        <p className="text-sm text-gray-500 text-center mt-2">Four specialized agents collaborate sequentially, each building on the last.</p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS.map((a, i) => (
            <div key={a.name} className="relative flex flex-col gap-3 p-5 rounded-xl bg-gray-900 border border-gray-800">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${a.color}`}>
                {a.icon}
              </div>
              <div className="absolute top-4 right-4 text-xs font-mono text-gray-700">#{i + 1}</div>
              <h3 className="text-sm font-semibold text-white">{a.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App mockup */}
      <section className="max-w-5xl mx-auto w-full px-4 py-10">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-gray-600 font-mono">squint.app</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-800 min-h-48">
            <div className="flex items-center justify-center p-6 text-center col-span-1">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-600 text-lg">📸</span>
                </div>
                <p className="text-xs text-gray-600">Upload + config</p>
              </div>
            </div>
            <div className="p-4 col-span-1">
              <p className="text-xs text-gray-700 font-mono mb-2">Agent activity</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /><span className="text-xs text-cyan-400/60 font-mono">Analyst · analyzing layout…</span></div>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" /><span className="text-xs text-violet-400/60 font-mono">Architect · planning…</span></div>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-emerald-400/60 font-mono">Generator · writing code…</span></div>
              </div>
            </div>
            <div className="flex items-center justify-center p-6 text-center col-span-1">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Code2 className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-xs text-gray-600">Clean code output</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16 border-t border-gray-800/60">
        <h2 className="text-2xl font-bold text-white text-center">Built for quality</h2>
        <p className="text-sm text-gray-500 text-center mt-2">Every decision was made to get code you can actually use.</p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-gray-900 border border-gray-800">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-2xl mx-auto w-full px-4 py-16 border-t border-gray-800/60 text-center">
        <h2 className="text-2xl font-bold text-white">Simple pricing</h2>
        <p className="text-sm text-gray-500 mt-2">Start free. Upgrade when you need more.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex-1 max-w-xs p-6 rounded-xl bg-gray-900 border border-gray-800 text-left">
            <p className="text-3xl font-bold text-white">$0</p>
            <p className="text-xs text-gray-600 mt-0.5">forever</p>
            <ul className="mt-4 space-y-2 text-xs text-gray-400">
              <li>✓ 3 conversions / day</li>
              <li>✓ All frameworks</li>
              <li>✓ Live agent stream</li>
            </ul>
            <Link to="/app" className="mt-5 block py-2 rounded-lg border border-gray-700 text-sm text-gray-300 text-center hover:border-gray-500 transition-colors">
              Start free
            </Link>
          </div>
          <div className="flex-1 max-w-xs p-6 rounded-xl bg-gray-900 border border-brand-500/40 ring-1 ring-brand-500/20 text-left">
            <p className="text-3xl font-bold text-white">$9<span className="text-base font-normal text-gray-500">/mo</span></p>
            <p className="text-xs text-gray-600 mt-0.5">billed monthly</p>
            <ul className="mt-4 space-y-2 text-xs text-gray-300">
              <li className="text-brand-400">✓ 200 conversions / month</li>
              <li>✓ Conversion history</li>
              <li>✓ Priority processing</li>
              <li>✓ Early access</li>
            </ul>
            <Link to="/pricing" className="mt-5 block py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm text-white font-semibold text-center transition-colors">
              Get Pro
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto w-full px-4 py-16 border-t border-gray-800/60">
        <h2 className="text-2xl font-bold text-white text-center">FAQ</h2>
        <div className="mt-8 space-y-6">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-gray-800/60 pb-6">
              <h3 className="text-sm font-semibold text-white">{item.q}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-xl mx-auto w-full px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-white">Ready to stop rebuilding by hand?</h2>
        <p className="text-sm text-gray-500 mt-3">3 free conversions per day. No credit card.</p>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
        >
          Try Squint free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <footer className="border-t border-gray-800/60 py-8 px-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-white">squint<span className="text-brand-500">.</span></span>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <Link to="/docs" className="hover:text-gray-400 transition-colors">Docs</Link>
            <Link to="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
            <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
            <a href="mailto:support@squint.dev" className="hover:text-gray-400 transition-colors">Support</a>
          </div>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} Squint. CrewAI + Groq + FastAPI.</p>
        </div>
      </footer>
    </div>
  );
}
