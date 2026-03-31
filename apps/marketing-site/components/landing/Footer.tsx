import Link from "next/link";

const SHOPIFY_APP_URL = "https://apps.shopify.com/delivai";


export function Footer() {
  return (
    <footer className="bg-brand-text text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl">DelivAI</span>
            </div>
            <p className="text-white/60 max-w-xs mb-6">
              AI-powered customer support for Shopify stores. Resolve 80% of delivery questions automatically.
            </p>
            <a
              href={SHOPIFY_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-primary-dark transition-colors text-sm"
            >
              Install on Shopify
            </a>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/install" className="hover:text-white transition-colors">Quick Install</Link></li>
              <li><a href={SHOPIFY_APP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Shopify App Store</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/guides" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><a href="mailto:support@delivai.com" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <p>© 2025 DelivAI. All rights reserved.</p>
          <p>
            Powered by{" "}
            <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              Anthropic Claude
            </a>{" "}
            ·{" "}
            <a href="https://easypost.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              EasyPost
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
