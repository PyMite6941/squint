import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "April 28, 2026";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link to="/" className="text-lg font-bold text-white tracking-tight">
          squint<span className="text-brand-500">.</span>
        </Link>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-gray-600 mt-2">Effective: {EFFECTIVE_DATE}</p>

        <div className="mt-10 space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">What we collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-gray-300">Email address</strong> — used for magic-link sign-in and subscription management.</li>
              <li><strong className="text-gray-300">Usage count</strong> — we track how many conversions you've used in the current day/month to enforce limits.</li>
              <li><strong className="text-gray-300">Conversion history</strong> — for Pro users, we store the generated code (not the screenshot) so you can access past conversions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">What we do NOT store</h2>
            <p>We do not store your screenshots after the API response is returned. Screenshots are transmitted to Groq's API for inference and are not retained on our servers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Third-party services</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-gray-300">Groq</strong> — processes your screenshots for inference. See <a href="https://groq.com/privacy-policy" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">Groq's privacy policy</a>.</li>
              <li><strong className="text-gray-300">Supabase</strong> — stores your account data and conversion history. Data is stored in US-East AWS region.</li>
              <li><strong className="text-gray-300">Lemon Squeezy</strong> — processes payments. Acts as Merchant of Record. See <a href="https://www.lemonsqueezy.com/privacy" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">their privacy policy</a>.</li>
              <li><strong className="text-gray-300">Upstash Redis</strong> — used for per-user rate limiting. Stores only a request count keyed to your user ID, with a 60-second TTL.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">How we use your data</h2>
            <p>We use your data only to provide the service: authenticating you, enforcing usage limits, and (for Pro users) persisting conversion history. We do not sell your data or use it for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Data retention</h2>
            <p>Account data is retained while your account is active. You may request deletion by emailing <a href="mailto:support@squint.dev" className="text-brand-400 hover:underline">support@squint.dev</a> — we'll process it within 7 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Cookies</h2>
            <p>Squint uses a single session cookie set by Supabase Auth to keep you signed in. No tracking cookies, no analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Contact</h2>
            <p><a href="mailto:support@squint.dev" className="text-brand-400 hover:underline">support@squint.dev</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
