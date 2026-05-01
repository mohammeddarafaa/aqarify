import { Helmet } from "react-helmet-async";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { DiscoveryHero } from "../components/discovery-hero";
import { DiscoveryFeaturedCarousel } from "../components/discovery-featured-carousel";
import { DiscoveryValueSplit } from "../components/discovery-value-split";
import { DiscoveryBottomCta } from "../components/discovery-bottom-cta";

export default function DiscoveryPage() {
  const { appName } = useTenantUi();
  return (
    <>
      <Helmet>
        <title>{`Discover — ${appName}`}</title>
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
