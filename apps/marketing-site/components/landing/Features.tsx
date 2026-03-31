"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Truck,
  XCircle,
  RefreshCw,
  MapPin,
  Users,
  Inbox,
} from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    color: "#5B4FE8",
    title: "AI Delivery Tracking",
    description:
      "Customers ask \"Where's my order?\" — Aria checks EasyPost for real-time carrier status and replies in under 1 second.",
  },
  {
    icon: XCircle,
    color: "#EF4444",
    title: "Instant Order Cancellation",
    description:
      "AI confirms with the customer, then cancels the unfulfilled order and initiates a refund — all in one message.",
  },
  {
    icon: RefreshCw,
    color: "#10B981",
    title: "Automated Refunds",
    description:
      "Process full or partial refunds without leaving the chat. AI handles the Shopify mutation and confirms with the customer.",
  },
  {
    icon: MapPin,
    color: "#F59E0B",
    title: "Delivery Rebook",
    description:
      "When a package fails delivery, AI collects the new address and creates a fresh shipment via EasyPost automatically.",
  },
  {
    icon: Users,
    color: "#7C3AED",
    title: "Human Handoff",
    description:
      "Complex issues or frustrated customers get escalated instantly. Agents see the full conversation history and context.",
  },
  {
    icon: Inbox,
    color: "#2563EB",
    title: "Help Desk Inbox",
    description:
      "Full-featured inbox inside Shopify Admin. Reply, assign, tag, use macros, and track SLAs — just like Gorgias.",
  },
];

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          ref={ref}
        >
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            One AI agent.{" "}
            <span className="text-gradient">All your support needs.</span>
          </h2>
          <p className="text-xl text-brand-text-muted max-w-2xl mx-auto">
            DelivAI handles the full lifecycle of delivery support — from &ldquo;where is my order&rdquo; to
            refunds and rebooking — automatically.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: (typeof FEATURES)[number];
  index: number;
  isInView: boolean;
}

function FeatureCard({ feature, index, isInView }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white border border-gray-100 rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-default"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${feature.color}15` }}
      >
        <Icon size={22} style={{ color: feature.color }} />
      </div>
      <h3 className="text-lg font-display font-bold mb-2 text-brand-text">{feature.title}</h3>
      <p className="text-brand-text-muted text-sm leading-relaxed">{feature.description}</p>

      {/* Hover accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
        style={{ background: feature.color }}
      />
    </motion.div>
  );
}
