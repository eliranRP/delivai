import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Key, MessageSquare, Inbox, Cpu, CreditCard } from "lucide-react";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Guides & Documentation — DelivAI",
  description: "Everything you need to set up and use DelivAI on your Shopify store.",
};

const GUIDES = [
  {
    icon: BookOpen,
    color: "#5B4FE8",
    title: "Getting Started",
    description: "Connect your store, sync your product catalog, and install the chat widget in under 5 minutes.",
    href: "/install",
    time: "5 min read",
  },
  {
    icon: Key,
    color: "#10B981",
    title: "Setting Up Your Claude API Key",
    description: "Step-by-step guide to getting your Anthropic API key and connecting it to DelivAI.",
    href: "/install#step-2",
    time: "3 min read",
  },
  {
    icon: MessageSquare,
    color: "#F59E0B",
    title: "Customizing Your AI Assistant",
    description: "Configure your AI persona, greeting message, and escalation threshold.",
    href: "/guides/customize-ai",
    time: "4 min read",
  },
  {
    icon: Inbox,
    color: "#7C3AED",
    title: "Managing Your Inbox",
    description: "Reply, assign, use macros, resolve conversations, and track SLAs from your Shopify Admin.",
    href: "/guides/inbox",
    time: "5 min read",
  },
  {
    icon: Cpu,
    color: "#EF4444",
    title: "Understanding AI Actions",
    description: "What the AI can and cannot do — tracking, cancellations, refunds, and rebooking explained.",
    href: "/guides/ai-actions",
    time: "3 min read",
  },
  {
    icon: CreditCard,
    color: "#2563EB",
    title: "Billing & Plans",
    description: "How to upgrade your plan, understand usage limits, and manage your subscription.",
    href: "/#pricing",
    time: "2 min read",
  },
];

export default function GuidesPage() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-brand-surface pt-16">
      {/* Header */}
      <div className="bg-brand-text text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Documentation & Guides
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Everything you need to get the most out of DelivAI on your Shopify store.
          </p>
        </div>
      </div>

      {/* Guides grid */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.title}
                href={guide.href}
                className="group bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${guide.color}15` }}
                >
                  <Icon size={22} style={{ color: guide.color }} />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">
                    {guide.title}
                  </h3>
                  <ArrowRight size={16} className="text-brand-text-muted group-hover:text-brand-primary transition-colors flex-shrink-0 mt-1" />
                </div>
                <p className="text-brand-text-muted text-sm leading-relaxed mb-3">{guide.description}</p>
                <span className="text-xs text-brand-text-muted/60">{guide.time}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center bg-white rounded-3xl p-8 shadow-card border border-gray-100">
          <h2 className="font-display font-bold text-xl mb-2">Need more help?</h2>
          <p className="text-brand-text-muted mb-4">Our team is available to help you get set up.</p>
          <a
            href="mailto:support@delivai.com"
            className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-2xl hover:bg-brand-primary-dark transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
