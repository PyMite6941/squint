import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold text-gray-800">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">This page doesn't exist — or maybe it squinted out of existence.</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>
    </div>
  );
}
