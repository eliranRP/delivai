import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://delivai.com"),
  title: "DelivAI — AI Customer Support for Shopify Stores",
  description:
    "Resolve 80% of delivery questions automatically. Track orders, cancel, refund, and rebook — all through an AI-powered chat widget on your Shopify store.",
  keywords: ["shopify", "AI customer support", "delivery tracking", "order management", "helpdesk"],
  authors: [{ name: "DelivAI" }],
  openGraph: {
    type: "website",
    title: "DelivAI — AI Customer Support for Shopify",
    description: "Resolve 80% of delivery questions automatically. Install in 5 minutes.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    siteName: "DelivAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "DelivAI — AI Customer Support for Shopify",
    description: "Resolve 80% of delivery questions automatically.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#5B4FE8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body bg-white text-brand-text antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
