import { Helmet } from "react-helmet-async";
import { useTenantStore } from "@/stores/tenant.store";
import { Navbar } from "@/features/landing/components/navbar";
import {
  DiscoveryHero,
  DiscoveryFeaturedCarousel,
  DiscoveryValueSplit,
  DiscoveryBottomCta,
} from "@/features/discovery";
import { AmenitiesSection } from "@/features/landing/components/amenities-section";
import { TestimonialsStrip } from "@/features/landing/components/testimonials-strip";
import { ContactSection } from "@/features/landing/components/contact-section";
import { Footer } from "@/features/landing/components/footer";

export default function LandingPage() {
  const tenant = useTenantStore((s) => s.tenant);
  return (
    <>
      <Helmet>
        <title>{tenant?.name ?? "البوابة"} | حجز الوحدات</title>
        <meta
          name="description"
          content={`${tenant?.name ?? "المطور"} — مشاريع ووحدات سكنية في ${tenant?.address ?? "مصر"}`}
        />
      </Helmet>
      <Navbar />
      <main>
        <DiscoveryHero />
        <DiscoveryFeaturedCarousel />
        <DiscoveryValueSplit />
        <AmenitiesSection />
        <TestimonialsStrip />
        <ContactSection />
        <DiscoveryBottomCta />
      </main>
      <Footer />
    </>
  );
}
