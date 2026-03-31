import type { Metadata } from "next";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";
import { Pricing } from "~/components/landing/Pricing";

export const metadata: Metadata = {
  title: "Pricing — DelivAI",
  description:
    "Simple, transparent pricing for Shopify stores of every size. Start with a 14-day free trial.",
};

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, cancel from your Shopify Admin at any time. No cancellation fees. Your 14-day trial ends and you won't be charged.",
  },
  {
    question: "What happens when I hit my conversation limit?",
    answer:
      "On Starter and Growth plans, the AI pauses and new conversations go straight to your inbox. You can upgrade anytime to restore AI handling.",
  },
  {
    question: "Do I need my own Claude API key?",
    answer:
      "Yes. DelivAI uses a BYOK (Bring Your Own Key) model. Get your key at console.anthropic.com. Your Claude API costs are billed directly by Anthropic.",
  },
  {
    question: "Is EasyPost required?",
    answer:
      "No. EasyPost is optional and only needed for real-time carrier tracking and delivery rebooking. Basic order status works without it.",
  },
  {
    question: "How does billing work?",
    answer:
      "Monthly billing via Shopify Billing API. You're charged on your Shopify invoice alongside your other app subscriptions.",
  },
];

export default function PricingPage(): React.ReactElement {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-brand-surface pt-16">
        {/* Page header */}
        <div className="bg-brand-text text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">
              Start free for 14 days. No credit card required. Upgrade or cancel
              anytime from your Shopify Admin.
            </p>
          </div>
        </div>

        {/* Pricing component */}
        <Pricing />

        {/* FAQ section */}
        <section className="max-w-2xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-display font-bold text-brand-text text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-display font-semibold text-brand-text select-none">
                  {item.question}
                  <span className="text-brand-primary text-xl leading-none flex-shrink-0 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-brand-text-muted leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
