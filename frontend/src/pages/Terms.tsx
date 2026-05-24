import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "April 28, 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link to="/" className="text-lg font-bold text-white tracking-tight">
          squint<span className="text-brand-500">.</span>
        </Link>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16 prose-sm">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="text-xs text-gray-600 mt-2">Effective: {EFFECTIVE_DATE}</p>

        <div className="mt-10 space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Service</h2>
            <p>Squint ("we", "us") provides a screenshot-to-code conversion service powered by Groq's Llama 4 Scout model. By using Squint you agree to these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Eligibility and Geographic Restrictions</h2>
            <p>Squint is not available to users located in the European Union. The underlying AI model (Meta Llama 4 Scout) is not licensed for commercial use in the EU under its usage policy. By using Squint you confirm you are not located in the EU.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Free Tier</h2>
            <p>Free accounts receive 3 conversions per day. This limit resets at midnight UTC. We reserve the right to change free tier limits at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Pro Tier — Fair Use</h2>
            <p>Pro subscribers receive up to <strong className="text-gray-300">200 conversions per calendar month</strong>. This is a fair-use cap intended to protect shared infrastructure. Automated or programmatic use that would exceed this cap requires a separate arrangement. Accounts that consistently approach or exceed this limit in ways that suggest abuse may be suspended.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Payments and Cancellation</h2>
            <p>Payments are processed by Lemon Squeezy, our Merchant of Record. Subscriptions renew monthly. You may cancel at any time from your Lemon Squeezy dashboard; access continues until the end of the billing period. We do not offer refunds on used months.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Your Content</h2>
            <p>You retain all rights to screenshots you upload. We do not store your screenshots after the conversion response is returned. The generated code is yours to use in any project, commercial or otherwise, without attribution.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Acceptable Use</h2>
            <p>You agree not to: use Squint to generate code for illegal purposes; attempt to reverse-engineer or circumvent rate limits; resell or sublicense access to the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">8. Disclaimer of Warranties</h2>
            <p>Squint is provided "as is". We do not guarantee the accuracy, completeness, or fitness-for-purpose of any generated code. Always review generated code before deploying to production.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Squint's liability is limited to the amount you paid us in the 30 days preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">10. Changes</h2>
            <p>We may update these terms at any time. Continued use after changes constitutes acceptance. Material changes will be emailed to Pro subscribers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">11. Contact</h2>
            <p>Questions: <a href="mailto:support@squint.dev" className="text-brand-400 hover:underline">support@squint.dev</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
