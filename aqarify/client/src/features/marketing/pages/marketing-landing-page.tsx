import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketingHero } from "../components/marketing-hero";
import { FeatureBento } from "../components/feature-bento";
import { TrustStrip } from "../components/trust-strip";
import { PricingSection } from "../components/pricing-section";
import { TestimonialStrip } from "../components/testimonial-strip";
import { FaqSection } from "../components/faq-section";
import { ContactSection } from "../components/contact-section";
import { MarketingCTA } from "../components/marketing-cta";

// Scrolls to a hash target after the page renders. Runs on mount and on
// every hash change so in-page anchors (#pricing, #faq, ...) behave like
// native anchors even when arriving from another route.
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    const id = hash.replace(/^#/, "");
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }, [hash]);
}

export default function MarketingLandingPage() {
  useHashScroll();

  return (
    <>
      <Helmet>
        <title>Aqarify — The multi-tenant real-estate SaaS for Egypt</title>
        <meta
          name="description"
          content="Launch your own branded property portal in a weekend. Online reservations, agent CRM, waiting lists, and Paymob-powered payments — one subscription, every tenant isolated."
        />
      </Helmet>

      <MarketingHero />

      <section id="features">
        <FeatureBento />
      </section>

      <section id="guardrails">
        <TrustStrip />
      </section>

      <PricingSection />

      <section id="testimonials">
        <TestimonialStrip />
      </section>

      <FaqSection />

      <ContactSection />

      <MarketingCTA />
    </>
  );
}
