"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Star, Zap, Shield } from "lucide-react";

const SHOPIFY_APP_URL = "https://apps.shopify.com/delivai"; // Replace with real URL after listing

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number] } },
};

export function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-surface">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-primary opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-secondary opacity-[0.06] blur-3xl" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5B4FE8" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div variants={container} initial="hidden" animate={mounted ? "show" : "hidden"}>
            <motion.div variants={item}>
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Zap size={14} />
                AI-powered customer support for Shopify
              </div>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.05] tracking-tight mb-6"
            >
              Resolve{" "}
              <span className="text-gradient">80% of delivery questions</span>{" "}
              automatically
            </motion.h1>

            <motion.p
              variants={item}
              className="text-xl text-brand-text-muted leading-relaxed mb-8 max-w-lg"
            >
              DelivAI installs in 5 minutes and handles tracking, cancellations, refunds, and rebooking — without a human agent.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href={SHOPIFY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-glow text-base"
              >
                Install Free — 14-day trial
                <ArrowRight size={18} />
              </a>
              <Link
                href="/install"
                className="inline-flex items-center justify-center gap-2 bg-white border border-brand-primary/20 hover:border-brand-primary/40 text-brand-text font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-brand-surface text-base"
              >
                See how it works
              </Link>
            </motion.div>

            <motion.div
              variants={item}
              className="flex items-center gap-6 text-sm text-brand-text-muted"
            >
              <div className="flex items-center gap-1">
                <Shield size={14} className="text-brand-secondary" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-brand-accent" />
                Works with all Shopify plans
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Product mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* Browser chrome mockup */}
              <div className="bg-white rounded-3xl shadow-card-hover overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
                      <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-lg px-3 py-1 text-xs text-gray-400 text-center">
                    yourstore.myshopify.com
                  </div>
                </div>

                {/* Storefront + widget preview */}
                <div className="relative bg-gray-50 p-6 min-h-[400px]">
                  {/* Fake store content */}
                  <div className="space-y-3 mb-6">
                    <div className="h-6 bg-gray-200 rounded w-40" />
                    <div className="h-4 bg-gray-100 rounded w-72" />
                    <div className="h-4 bg-gray-100 rounded w-56" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="bg-gray-100 rounded-lg h-24 mb-2" />
                        <div className="h-3 bg-gray-200 rounded mb-1" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                      </div>
                    ))}
                  </div>

                  {/* Chat widget */}
                  <div className="absolute bottom-4 right-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      {/* Open panel */}
                      <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-card-hover overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className="bg-brand-primary px-4 py-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                          <div>
                            <div className="text-white text-sm font-semibold">Aria</div>
                            <div className="text-white/70 text-xs flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              Online
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="p-3 space-y-2 bg-gray-50">
                          <div className="bg-white rounded-xl rounded-tl-sm p-2.5 text-xs shadow-sm max-w-[80%]">
                            Hi! I can help track or manage your order. 👋
                          </div>
                          <div className="flex justify-end">
                            <div className="bg-brand-primary text-white rounded-xl rounded-tr-sm p-2.5 text-xs max-w-[80%]">
                              Where&apos;s my order #1234?
                            </div>
                          </div>
                          <div className="bg-white rounded-xl rounded-tl-sm p-2.5 text-xs shadow-sm max-w-[85%]">
                            <div className="flex items-center gap-1 mb-1 font-medium">📦 Order #1234</div>
                            <div className="text-gray-500">Status: Out for delivery</div>
                            <div className="text-green-600 font-medium mt-1">Est. today by 6 PM 🚚</div>
                          </div>
                        </div>

                        {/* Input */}
                        <div className="p-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <span className="text-xs text-gray-400 flex-1">Ask about your order...</span>
                            <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Launcher */}
                      <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-glow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating stat badges */}
              <motion.div
                className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-8 h-8 bg-brand-secondary/10 rounded-full flex items-center justify-center text-brand-secondary text-sm">✓</div>
                <div>
                  <div className="text-xs font-bold text-brand-text">80% resolved</div>
                  <div className="text-xs text-brand-text-muted">by AI, no human</div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-6 bottom-1/3 bg-white rounded-2xl shadow-card px-4 py-3"
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="text-xs font-bold text-brand-text">⚡ &lt;1s response</div>
                <div className="text-xs text-brand-text-muted">average reply time</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
