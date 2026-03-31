import type { Metadata } from "next";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — DelivAI",
  description: "Terms governing your use of the DelivAI platform.",
};

export default function TermsPage() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-brand-text-muted mb-10">Last updated: March 29, 2025</p>

        <div className="prose prose-lg max-w-none text-brand-text">
          <h2 className="font-display font-bold text-2xl mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            By installing and using DelivAI on your Shopify store, you agree to these Terms of Service. If you do not agree, please uninstall the app.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">2. Service Description</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            DelivAI provides an AI-powered customer support service for Shopify merchants, including automated responses to delivery-related queries, order management actions, and a help desk inbox. The AI functionality requires merchants to provide their own Anthropic Claude API key (BYOK — Bring Your Own Key).
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">3. Billing</h2>
          <p className="text-brand-text-muted leading-relaxed mb-4">
            DelivAI is billed monthly through Shopify Billing. Plans are:
          </p>
          <ul className="list-disc pl-6 text-brand-text-muted space-y-2 mb-6">
            <li><strong>Starter</strong> — $29/month (500 AI conversations)</li>
            <li><strong>Growth</strong> — $79/month (2,000 AI conversations)</li>
            <li><strong>Scale</strong> — $199/month (unlimited conversations)</li>
          </ul>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            All plans include a 14-day free trial. You may cancel at any time. Claude API costs are billed directly by Anthropic based on your usage.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">4. Acceptable Use</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            You may not use DelivAI to violate Shopify&apos;s Terms of Service, engage in fraudulent activity, or attempt to circumvent usage limits. We reserve the right to suspend accounts that abuse the service.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            DelivAI is provided &quot;as is&quot;. AI responses are automated and may occasionally be incorrect. Merchants are responsible for reviewing escalated conversations and verifying AI actions. DelivAI&apos;s liability is limited to the amount paid in the last 30 days.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">6. Contact</h2>
          <p className="text-brand-text-muted leading-relaxed">
            For legal inquiries, contact us at{" "}
            <a href="mailto:legal@delivai.com" className="text-brand-primary hover:underline">legal@delivai.com</a>.
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
