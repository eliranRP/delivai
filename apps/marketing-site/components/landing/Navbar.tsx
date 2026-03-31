"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SHOPIFY_APP_URL = "https://apps.shopify.com/delivai";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <span className="font-display font-bold text-brand-text text-lg">DelivAI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">
              How it works
            </a>
            <Link href="/pricing" className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">
              Pricing
            </Link>
            <Link href="/guides" className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">
              Docs
            </Link>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={SHOPIFY_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-primary-dark transition-colors"
            >
              Install Free
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4"
          >
            <nav className="flex flex-col gap-4">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-brand-text-muted hover:text-brand-text">Features</a>
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-brand-text-muted hover:text-brand-text">How it works</a>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="text-brand-text-muted hover:text-brand-text">Pricing</Link>
              <Link href="/guides" onClick={() => setMobileOpen(false)} className="text-brand-text-muted hover:text-brand-text">Docs</Link>
              <a
                href={SHOPIFY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-primary text-white text-center font-semibold px-6 py-3 rounded-xl"
              >
                Install Free — 14-day trial
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
