"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Clock } from "lucide-react";

const SHOPIFY_APP_URL = "https://apps.shopify.com/delivai";

const INSTALL_STEPS = [
  { step: 1, label: "Click Install on Shopify App Store", time: "30s" },
  { step: 2, label: "Authorize DelivAI in your store", time: "30s" },
  { step: 3, label: "Add your Claude API key", time: "2 min" },
  { step: 4, label: "Enable chat widget in Theme Editor", time: "1 min" },
  { step: 5, label: "You're live! 🎉", time: "Done" },
];

export function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Install steps */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 text-brand-accent rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Clock size={14} />
              Live in under 5 minutes
            </div>
            <h2 className="text-4xl font-display font-bold mb-6">
              Get started in{" "}
              <span className="text-gradient">5 simple steps</span>
            </h2>

            <div className="space-y-4">
              {INSTALL_STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-brand-surface border border-transparent hover:border-brand-primary/20 transition-colors"
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {s.step}
                  </div>
                  <span className="text-brand-text flex-1">{s.label}</span>
                  <span className="text-xs text-brand-text-muted font-medium bg-white px-2 py-1 rounded-lg border border-gray-100 flex-shrink-0">
                    {s.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="bg-animated-gradient rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden">
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h3 className="text-3xl font-display font-bold mb-4">
                  Start your free trial today
                </h3>
                <p className="text-white/80 mb-6 text-lg">
                  14 days free. No credit card. Cancel anytime. Join hundreds of Shopify merchants using DelivAI.
                </p>

                <a
                  href={SHOPIFY_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold px-8 py-4 rounded-2xl hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] text-base mb-6"
                >
                  Install on Shopify — Free
                  <ArrowRight size={18} />
                </a>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                  {[
                    { value: "14 days", label: "Free trial" },
                    { value: "5 min", label: "Setup time" },
                    { value: "24/7", label: "AI availability" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-xl font-bold">{s.value}</div>
                      <div className="text-xs text-white/70">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
