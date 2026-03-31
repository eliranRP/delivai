import { Hero } from "~/components/landing/Hero";
import { Features } from "~/components/landing/Features";
import { HowItWorks } from "~/components/landing/HowItWorks";
import { Pricing } from "~/components/landing/Pricing";
import { CTA } from "~/components/landing/CTA";
import { Navbar } from "~/components/landing/Navbar";
import { Footer } from "~/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
