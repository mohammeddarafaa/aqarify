import { Helmet } from "react-helmet-async";
import { DiscoveryHero } from "../components/discovery-hero";
import { DiscoveryFeaturedCarousel } from "../components/discovery-featured-carousel";
import { DiscoveryValueSplit } from "../components/discovery-value-split";
import { DiscoveryBottomCta } from "../components/discovery-bottom-cta";

export default function DiscoveryPage() {
  return (
    <>
      <Helmet>
        <title>Discover — Aqarify</title>
      </Helmet>
      <div className="flex flex-col">
        <DiscoveryHero />
        <DiscoveryFeaturedCarousel />
        <DiscoveryValueSplit />
        <DiscoveryBottomCta />
      </div>
    </>
  );
}
