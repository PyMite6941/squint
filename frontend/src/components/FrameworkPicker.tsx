import { type Framework } from "../lib/api";

const OPTIONS: { value: Framework; label: string; icon: string }[] = [
  { value: "html", label: "HTML / CSS", icon: "🌐" },
  { value: "tailwind", label: "Tailwind", icon: "💨" },
  { value: "react", label: "React", icon: "⚛️" },
  { value: "vue", label: "Vue", icon: "🟢" },
];

interface Props {
  value: Framework;
  onChange: (f: Framework) => void;
}

export default function FrameworkPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            value === opt.value
              ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20"
              : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
          }`}
        >
          <span className="mr-1.5">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
