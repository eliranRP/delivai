"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, Cpu, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: MessageSquare,
    title: "Customer asks a question",
    description:
      "A customer opens the chat widget on your store and asks about their delivery: \"Where's my order?\" or \"I want to cancel #1234\".",
    color: "#5B4FE8",
    detail: "Embedded on your storefront via Shopify Theme App Extension",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Aria handles it automatically",
    description:
      "Your AI assistant reads the order from Shopify, checks EasyPost for tracking, and takes the requested action — in under 2 seconds.",
    color: "#10B981",
    detail: "Powered by Claude Sonnet 4.6 + your own API key",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Issue resolved, ticket closed",
    description:
      "The customer gets an answer and the conversation closes automatically. Complex cases are escalated to your inbox for human review.",
    color: "#F59E0B",
    detail: "80% of tickets resolved without a human agent",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-white" id="how-it-works" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            Simple 3-step process
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            How DelivAI works
          </h2>
          <p className="text-xl text-brand-text-muted max-w-2xl mx-auto">
            From question to resolution in seconds — no human needed for most delivery issues.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-1/2 -translate-x-1/2 w-[60%] h-0.5 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 32 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative text-center"
                >
                  {/* Step icon */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: `${step.color}15` }}
                      whileHover={{ scale: 1.1, rotate: 3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon size={28} style={{ color: step.color }} />
                    </motion.div>
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: step.color }}
                    >
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-display font-bold mb-3 text-brand-text">
                    {step.title}
                  </h3>
                  <p className="text-brand-text-muted leading-relaxed mb-3">{step.description}</p>
                  <p className="text-xs text-brand-text-muted/60 italic">{step.detail}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom stat bar */}
        <motion.div
          className="mt-16 grid grid-cols-3 gap-4 bg-brand-surface rounded-3xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          {[
            { value: "< 1s", label: "Average response time" },
            { value: "80%", label: "Tickets resolved by AI" },
            { value: "5 min", label: "Setup time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-display font-bold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-brand-text-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
