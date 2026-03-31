"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Zap } from "lucide-react";
import { PLAN_LIMITS } from "@delivai/shared-types";

const SHOPIFY_APP_URL = "https://apps.shopify.com/delivai";

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 29,
    description: "Perfect for new Shopify stores getting started with AI support.",
    highlight: false,
    features: [
      `${PLAN_LIMITS.starter.conversationsPerMonth} AI conversations/month`,
      `${PLAN_LIMITS.starter.maxAgents} human agents`,
      "AI delivery tracking",
      "Chat widget",
      "Basic inbox",
      "14-day free trial",
    ],
    cta: "Start free trial",
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: 79,
    description: "For growing stores that need full AI actions and a larger team.",
    highlight: true,
    features: [
      `${PLAN_LIMITS.growth.conversationsPerMonth.toLocaleString()} AI conversations/month`,
      `${PLAN_LIMITS.growth.maxAgents} human agents`,
      "Everything in Starter",
      "Order cancellation",
      "Automated refunds",
      "EasyPost delivery rebook",
      "Macros & saved replies",
      "14-day free trial",
    ],
    cta: "Start free trial",
  },
  {
    id: "scale" as const,
    name: "Scale",
    price: 199,
    description: "Unlimited everything for high-volume Shopify stores.",
    highlight: false,
    features: [
      "Unlimited AI conversations",
      "Unlimited agents",
      "Everything in Growth",
      "SLA management",
      "Analytics & reporting",
      "Custom AI persona",
      "Priority support",
      "14-day free trial",
    ],
    cta: "Start free trial",
  },
];

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-brand-surface" id="pricing" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            Simple pricing
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Start free.{" "}
            <span className="text-gradient">Upgrade when you grow.</span>
          </h2>
          <p className="text-xl text-brand-text-muted">
            All plans include a 14-day free trial. No credit card required to install.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.highlight
                  ? "bg-brand-primary text-white shadow-glow ring-2 ring-brand-primary scale-[1.02]"
                  : "bg-white border border-gray-100 shadow-card"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                  <Zap size={12} />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-display font-bold mb-1 ${plan.highlight ? "text-white" : "text-brand-text"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${plan.highlight ? "text-white/70" : "text-brand-text-muted"}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className={`text-5xl font-display font-bold ${plan.highlight ? "text-white" : "text-brand-text"}`}
                >
                  ${plan.price}
                </span>
                <span className={`text-sm ${plan.highlight ? "text-white/70" : "text-brand-text-muted"}`}>
                  /month
                </span>
              </div>

              <a
                href={SHOPIFY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 mb-8 hover:scale-[1.02] ${
                  plan.highlight
                    ? "bg-white text-brand-primary hover:bg-white/90"
                    : "bg-brand-primary text-white hover:bg-brand-primary-dark"
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={16}
                      className={`flex-shrink-0 mt-0.5 ${plan.highlight ? "text-white" : "text-brand-secondary"}`}
                    />
                    <span className={plan.highlight ? "text-white/90" : "text-brand-text"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-sm text-brand-text-muted mt-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          All plans billed monthly via Shopify Billing. Cancel anytime. Your Claude API costs are billed directly by Anthropic.
        </motion.p>
      </div>
    </section>
  );
}
