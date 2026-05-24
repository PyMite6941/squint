import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "Getting started",
    content: `Sign in with your email — no password needed. You'll get a magic link. Once signed in, you get 3 free conversions per day.`,
  },
  {
    title: "Supported input",
    content: `Upload any UI screenshot: PNG, JPG, or WebP up to 5 MB. Works best on clean, single-page or single-component screenshots. Complex dashboards with lots of data may produce partial results.`,
  },
  {
    title: "Output formats",
    content: `Squint outputs a single React functional component with Tailwind CSS. The component is self-contained and immediately renderable — just paste it into your project.`,
  },
  {
    title: "Quality tips",
    content: `• Crop tightly to the component you want — less noise = better output.\n• Use high-DPI screenshots where possible.\n• For complex layouts, convert sections separately and compose them yourself.\n• Simple UIs (login forms, hero sections, pricing cards) produce the most consistent results.`,
  },
  {
    title: "Known limitations",
    content: `• Chart and graph rendering is not supported — the model outputs placeholders.\n• Custom fonts are matched to the closest system or Google Font.\n• Animated elements are output as static code.\n• EU users: Llama 4 Scout is not licensed for use in the EU under Llama 4's usage policy.`,
  },
  {
    title: "Free vs Pro",
    content: `Free: 3 conversions per day.\nPro ($9/mo): 200 conversions per month, priority processing.`,
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link to="/" className="text-lg font-bold text-white tracking-tight">
          squint<span className="text-brand-500">.</span>
        </Link>
        <Link to="/app" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
          App
        </Link>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
        <h1 className="text-3xl font-bold text-white">Documentation</h1>
        <p className="text-gray-500 mt-2 text-sm">Everything you need to get the most out of Squint.</p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-semibold text-white">{s.title}</h2>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
