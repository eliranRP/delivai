import { Metadata } from "next";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Install DelivAI on Shopify — Live in 5 Minutes",
  description: "Step-by-step guide to install and configure DelivAI on your Shopify store.",
};

const SHOPIFY_APP_URL = "https://apps.shopify.com/delivai";
const ANTHROPIC_URL = "https://console.anthropic.com";
const EASYPOST_URL = "https://easypost.com";

const STEPS = [
  {
    number: 1,
    time: "30 sec",
    title: "Install from Shopify App Store",
    description: "Click the button below to open the DelivAI listing on the Shopify App Store, then click Install.",
    action: { label: "Open Shopify App Store", href: SHOPIFY_APP_URL, external: true },
    done: "DelivAI is now connected to your store.",
  },
  {
    number: 2,
    time: "2 min",
    title: "Get your Claude API key",
    description: "Sign up at console.anthropic.com, create an API key, and paste it in DelivAI Settings → AI Configuration.",
    action: { label: "Open Anthropic Console", href: ANTHROPIC_URL, external: true },
    done: "Your AI assistant is now powered by Claude.",
  },
  {
    number: 3,
    time: "1 min",
    title: "Enable the chat widget",
    description: "In your Shopify Admin, go to Online Store → Themes → Customize. Under App Embeds, enable DelivAI Chat.",
    done: "The chat widget appears on your storefront.",
  },
  {
    number: 4,
    time: "1 min",
    title: "Connect EasyPost (optional)",
    description: "For real-time tracking and delivery rebooking, add your EasyPost API key in Settings → AI Configuration.",
    action: { label: "Get EasyPost key", href: EASYPOST_URL, external: true },
    done: "AI can now track and rebook deliveries.",
  },
  {
    number: 5,
    time: "30 sec",
    title: "Test it live",
    description: "Visit your storefront and open the chat widget. Ask about a test order to see the AI in action.",
    done: "You're live! 🎉",
  },
];

export default function InstallPage() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-brand-surface pt-16">
      {/* Header */}
      <div className="bg-animated-gradient text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            ⚡ 5-minute setup
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Install DelivAI on your store
          </h1>
          <p className="text-white/80 text-xl">
            Follow these steps to get your AI support agent live in under 5 minutes.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="space-y-6">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="bg-white rounded-3xl p-6 shadow-card border border-gray-100"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg text-brand-text">{step.title}</h3>
                    <span className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-semibold">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-brand-text-muted mb-4">{step.description}</p>

                  {step.action && (
                    <a
                      href={step.action.href}
                      target={step.action.external ? "_blank" : undefined}
                      rel={step.action.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-primary-dark transition-colors mb-4"
                    >
                      {step.action.label}
                      {step.action.external && <ExternalLink size={14} />}
                    </a>
                  )}

                  <div className="flex items-center gap-2 text-sm text-brand-secondary">
                    <CheckCircle2 size={16} />
                    {step.done}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-brand-text-muted mb-4">Need help? Check our full documentation.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-2xl hover:bg-brand-primary-dark transition-colors"
            >
              View all guides
              <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:support@delivai.com"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-brand-text font-semibold px-6 py-3 rounded-2xl hover:bg-brand-surface transition-colors"
            >
              Email support
            </a>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
