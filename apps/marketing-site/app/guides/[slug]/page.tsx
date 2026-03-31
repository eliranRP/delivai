import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

interface GuideSection {
  heading: string;
  body: string;
}

interface GuideContent {
  title: string;
  icon: string;
  readTime: string;
  description: string;
  sections: GuideSection[];
}

type GuideSlug = "customize-ai" | "inbox" | "ai-actions";

const GUIDES: Record<GuideSlug, GuideContent> = {
  "customize-ai": {
    title: "Customizing Your AI Assistant",
    icon: "🤖",
    readTime: "4 min read",
    description:
      "Configure your AI persona, greeting message, and escalation settings.",
    sections: [
      {
        heading: "Accessing AI Settings",
        body: "In your Shopify Admin, open DelivAI and navigate to Settings → AI Configuration. You'll find all customization options here.",
      },
      {
        heading: "Setting Your AI Persona Name",
        body: "By default your assistant is named 'Aria'. You can change this to match your brand. The name appears in the chat widget header and in all automated messages.",
      },
      {
        heading: "Customizing the Greeting Message",
        body: "The greeting message is the first thing customers see when they open the chat widget. Keep it friendly and tell customers what the AI can help with. Example: 'Hi! I can help you track your order or make changes. What's your order number?'",
      },
      {
        heading: "Escalation Threshold",
        body: "The escalation threshold controls how confident the AI must be before escalating to a human. A value of 0.4 (40%) means the AI will escalate if it's less than 40% confident in its response. Lower values = more AI handling. Higher values = more human oversight.",
      },
      {
        heading: "Widget Appearance",
        body: "Set the widget color to match your brand (defaults to DelivAI indigo), choose bottom-right or bottom-left position, and toggle whether to collect email upfront before the conversation starts.",
      },
    ],
  },
  inbox: {
    title: "Managing Your Inbox",
    icon: "📥",
    readTime: "5 min read",
    description:
      "Handle escalated conversations, reply to customers, and track your support team's performance.",
    sections: [
      {
        heading: "Viewing Your Inbox",
        body: "Your inbox shows all conversations that have been escalated from AI to human agents. Access it from DelivAI → Inbox in your Shopify Admin. Conversations are sorted by most recent activity.",
      },
      {
        heading: "Conversation Status",
        body: "Each conversation has a status: Open (active, needs attention), Pending (waiting for customer reply), Resolved (issue closed), or Closed (archived). Filter by status using the tabs at the top of the inbox.",
      },
      {
        heading: "Replying to Customers",
        body: "Click any conversation to open the thread view. You'll see the full AI conversation history plus customer context (name, email, order history) in the right sidebar. Type your reply in the composer and click Send.",
      },
      {
        heading: "Using Macros",
        body: "Macros are saved reply templates for common responses. Create macros in Settings → Macros. Insert them in any reply with the macro button in the composer toolbar.",
      },
      {
        heading: "Assigning and Resolving",
        body: "Assign conversations to specific agents using the Assignee dropdown in the sidebar. Once resolved, click the 'Mark Resolved' button to close the conversation and remove it from the active queue.",
      },
    ],
  },
  "ai-actions": {
    title: "Understanding AI Actions",
    icon: "⚡",
    readTime: "3 min read",
    description:
      "Learn exactly what your AI assistant can and cannot do for your customers.",
    sections: [
      {
        heading: "What the AI Can Do",
        body: "Your AI assistant can: check real-time order status and tracking via EasyPost, cancel unfulfilled orders on customer request (with confirmation), issue full or partial refunds, update shipping addresses and create new shipments for failed deliveries, answer product and policy questions from your knowledge base.",
      },
      {
        heading: "Order Cancellation",
        body: "The AI will confirm with the customer before cancelling. It only cancels orders that haven't been fulfilled yet. Once confirmed, it triggers the Shopify orderCancel mutation and notifies the customer.",
      },
      {
        heading: "Refunds",
        body: "Refunds can be full (entire order) or partial (specific items). The AI initiates the Shopify refund mutation and provides the customer with confirmation. Refund processing time depends on the customer's payment method (typically 5-10 business days).",
      },
      {
        heading: "What the AI Cannot Do",
        body: "The AI cannot: access or share payment card details, process exchanges (only refund + new order), directly contact carriers, override Shopify's fraud protection, or take actions that require physical intervention.",
      },
      {
        heading: "Reviewing AI Actions",
        body: "Every action the AI takes is logged as a Tool Call in the conversation thread. In your inbox, expand any AI conversation to see the full tool call history — what was requested, what parameters were used, and what the result was.",
      },
    ],
  },
};

const GUIDE_ORDER: GuideSlug[] = ["customize-ai", "inbox", "ai-actions"];

function isGuideSlug(value: string): value is GuideSlug {
  return value in GUIDES;
}

export function generateStaticParams(): Array<{ slug: string }> {
  return [
    { slug: "customize-ai" },
    { slug: "inbox" },
    { slug: "ai-actions" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isGuideSlug(slug)) {
    return { title: "Guide Not Found — DelivAI" };
  }
  const guide = GUIDES[slug];
  return {
    title: `${guide.title} — DelivAI Guides`,
    description: guide.description,
  };
}

export default async function GuideSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;

  if (!isGuideSlug(slug)) {
    notFound();
  }

  const guide = GUIDES[slug];
  const currentIndex = GUIDE_ORDER.indexOf(slug);
  const nextSlug: GuideSlug | null =
    currentIndex < GUIDE_ORDER.length - 1
      ? (GUIDE_ORDER[currentIndex + 1] as GuideSlug)
      : null;
  const prevSlug: GuideSlug | null =
    currentIndex > 0 ? (GUIDE_ORDER[currentIndex - 1] as GuideSlug) : null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-brand-surface pt-16">
        {/* Dark header bar */}
        <div className="bg-brand-text text-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Guides
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" role="img" aria-label={guide.title}>
                {guide.icon}
              </span>
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <Clock size={13} />
                <span>{guide.readTime}</span>
              </div>
            </div>
            <nav className="text-white/50 text-sm mb-2">
              <Link href="/guides" className="hover:text-white transition-colors">
                Guides
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">{guide.title}</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-display font-bold">
              {guide.title}
            </h1>
            <p className="text-white/70 mt-3 text-lg">{guide.description}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="space-y-10">
            {guide.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display font-bold text-xl mb-3 text-brand-text">
                  {section.heading}
                </h2>
                <p className="text-brand-text-muted leading-relaxed">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          {/* Prev / Next navigation */}
          {(prevSlug !== null || nextSlug !== null) && (
            <div className="flex items-center justify-between gap-4 mt-14 pt-8 border-t border-gray-200">
              {prevSlug !== null ? (
                <Link
                  href={`/guides/${prevSlug}`}
                  className="group flex items-center gap-2 text-brand-text-muted hover:text-brand-primary transition-colors text-sm font-medium"
                >
                  <ArrowLeft
                    size={16}
                    className="group-hover:-translate-x-0.5 transition-transform"
                  />
                  {GUIDES[prevSlug].title}
                </Link>
              ) : (
                <span />
              )}
              {nextSlug !== null && (
                <Link
                  href={`/guides/${nextSlug}`}
                  className="group flex items-center gap-2 text-brand-text-muted hover:text-brand-primary transition-colors text-sm font-medium"
                >
                  {GUIDES[nextSlug].title}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              )}
            </div>
          )}

          {/* Next steps card */}
          <div className="mt-10 bg-white rounded-3xl p-8 shadow-card border border-gray-100 text-center">
            <h2 className="font-display font-bold text-xl mb-2 text-brand-text">
              Next steps
            </h2>
            <p className="text-brand-text-muted mb-5">
              Explore more guides to get the most out of DelivAI.
            </p>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              View all guides
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
