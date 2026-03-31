import type { Metadata } from "next";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — DelivAI",
  description: "How DelivAI collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-brand-text-muted mb-10">Last updated: March 29, 2025</p>

        <div className="prose prose-lg max-w-none text-brand-text">
          <h2 className="font-display font-bold text-2xl mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-brand-text-muted leading-relaxed mb-4">
            DelivAI collects information necessary to provide our AI customer support service to Shopify merchants. This includes:
          </p>
          <ul className="list-disc pl-6 text-brand-text-muted space-y-2 mb-6">
            <li>Shopify store information (shop domain, access token) required for Shopify app functionality</li>
            <li>Customer conversation data (messages, order references) to power AI responses</li>
            <li>API keys you provide (Claude, EasyPost) — stored encrypted at rest using AES-256-GCM</li>
            <li>Usage analytics to improve our service</li>
          </ul>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-brand-text-muted leading-relaxed mb-4">
            We use collected information solely to provide the DelivAI service:
          </p>
          <ul className="list-disc pl-6 text-brand-text-muted space-y-2 mb-6">
            <li>Processing customer support conversations via AI</li>
            <li>Accessing Shopify order data to answer customer queries</li>
            <li>Providing real-time delivery tracking via EasyPost</li>
            <li>Billing via Shopify Billing API</li>
          </ul>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">3. Data Storage & Security</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            All data is stored in encrypted PostgreSQL databases. API keys are encrypted using AES-256-GCM before storage. We follow Shopify&apos;s security requirements and never store sensitive payment information.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">4. GDPR Compliance</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            DelivAI implements all required Shopify GDPR webhooks. Upon receiving a data deletion request, we remove all personal data associated with the affected shop or customer within 30 days.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">5. Third-Party Services</h2>
          <p className="text-brand-text-muted leading-relaxed mb-6">
            DelivAI uses Anthropic Claude (AI processing) and EasyPost (delivery tracking) as third-party services. Your API keys for these services are used only to make requests on your behalf and are never shared with other merchants.
          </p>

          <h2 className="font-display font-bold text-2xl mt-8 mb-4">6. Contact</h2>
          <p className="text-brand-text-muted leading-relaxed">
            For privacy inquiries, contact us at{" "}
            <a href="mailto:privacy@delivai.com" className="text-brand-primary hover:underline">privacy@delivai.com</a>.
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
