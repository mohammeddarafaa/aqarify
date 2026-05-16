import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";

/**
 * White-label hero section.
 *
 * Every string (title, subtitle, description, CTA) comes from:
 *   tenant.tenant_ui_config.content.*
 *
 * No fallback to hardcoded Arabic — if a tenant hasn't configured a string,
 * the field is simply empty or hidden.  Configure via Admin → المحتوى tab.
 */
export function HeroSection() {
  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();
  const content = tenant?.tenant_ui_config?.content;
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const heroTitle    = content?.hero_title;
  const heroSub      = content?.hero_subtitle;
  const heroDesc     = content?.hero_description;
  const heroImg      = tenant?.theme_config?.hero_image_url as string | undefined;

  if (!heroTitle && !heroSub) return null;

  return (
    <section
      className="relative isolate flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={
        heroImg
          ? {
              backgroundImage: `url(${heroImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { background: "var(--tenant-gradient)" }
      }
    >
      {/* Overlay for text readability on image backgrounds */}
      {heroImg && (
        <div className="absolute inset-0 bg-foreground/60" />
      )}

      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        {heroTitle && (
          <h1 className="display-xl text-background drop-shadow-sm">
            {heroTitle}
          </h1>
        )}
        {heroSub && (
          <p className="text-xl font-medium text-background/90">
            {heroSub}
          </p>
        )}
        {heroDesc && (
          <p className="mx-auto max-w-xl text-base text-background/75">
            {heroDesc}
          </p>
        )}

        {/* Quick search / CTA */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to={withTenant("/browse")}
            className="flex items-center gap-2 rounded-full bg-background px-8 py-3.5 text-sm font-semibold text-foreground shadow-lg transition-opacity hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            تصفّح الوحدات
          </Link>
          <Link
            to={withTenant("/browse#projects")}
            className="flex items-center gap-2 text-sm font-medium text-background/85 underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            المشاريع المميزة
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
