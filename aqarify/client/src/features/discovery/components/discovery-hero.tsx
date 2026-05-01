import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, Search, Star } from "lucide-react";
import { motionTransitions } from "@/components/motion/presets";
import { ShimmeringText } from "@/components/motion/shimmering-text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";
import { usePublicProjects } from "@/features/browse/hooks/use-public-projects";

export function DiscoveryHero() {
  const shouldReduceMotion = useReducedMotion();
  const tenant = useTenantStore((s) => s.tenant);
  const { appName, ui } = useTenantUi();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const name = appName;
  const area = tenant?.address ?? "مصر";

  const { data: projects, isLoading: projectsLoading } = usePublicProjects();
  const projectCount = projects?.length ?? 0;
  const heroImage =
    projects?.find((p) => p.cover_image_url)?.cover_image_url ??
    projects?.find((p) => p.gallery?.length)?.gallery?.[0] ??
    tenant?.logo_url ??
    null;

  const statPrimary = projectsLoading ? "—" : projectCount > 0 ? `${projectCount}` : "جديد";
  const statSecondary = "مصر";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/70 via-background to-background pt-20">
      <div className="relative mx-auto grid max-w-screen-xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pb-20 lg:pt-10">
        <div className="order-2 lg:order-1">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={motionTransitions.layout}
            className="mb-5 flex flex-wrap gap-2"
          >
            <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground">
              بوابة حجز رسمية
            </span>
            <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              دفع آمن
            </span>
          </motion.div>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            transition={{ ...motionTransitions.layout, delay: 0.05 }}
            className="label-overline mb-4 text-[var(--color-muted-foreground)]"
          >
            <ShimmeringText text={`${name} · ${area}`} />
          </motion.p>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ ...motionTransitions.layout, delay: 0.08 }}
            className="display-xl max-w-xl text-balance text-foreground"
          >
            {ui?.content.hero_title ?? "اكتشف مشاريعنا"}
            <br />
            <span className="text-foreground/85">
              {ui?.content.hero_subtitle ?? "ثم وحداتك — احجز بخطوات واضحة"}
            </span>
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            transition={{ ...motionTransitions.layout, delay: 0.15 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground"
          >
            {ui?.content.hero_description ??
              "تصفّح المشاريع، قارن الأسعار والمساحات، واحجز عبر منصة موثوقة مع متابعة لحالة طلبك في أي وقت."}
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ ...motionTransitions.layout, delay: 0.2 }}
            className="mt-8"
          >
            <Card className="rounded-3xl border-[var(--color-border)] shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm text-foreground">
                    <MapPin className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    <span className="truncate">{area}</span>
                  </div>
                  <Button asChild className="h-11 shrink-0 rounded-full px-6">
                    <Link to={withTenant("/browse")} className="inline-flex items-center gap-2">
                      <Search className="size-4" />
                      استكشف المشاريع
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            transition={{ ...motionTransitions.layout, delay: 0.28 }}
            className="mt-10 flex flex-col gap-6 border-t border-[var(--color-border)] pt-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-10">
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">{statPrimary}</p>
                <p className="label-muted mt-1">
                  مشاريع منشورة
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">{statSecondary}</p>
                <p className="label-muted mt-1">
                  تغطية
                </p>
              </div>
            </div>

            <Card className="max-w-sm border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-background)_90%,transparent)] shadow-sm backdrop-blur-sm">
              <CardContent className="flex items-center gap-3 p-3">
              <Avatar className="size-11 border border-[var(--color-border)]">
                <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-start">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  «تجربة حجز سلسة وواجهة واضحة — أنصح بها لأي مستثمر.»
                </p>
              </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ ...motionTransitions.layout, delay: 0.12, duration: 0.55 }}
          className="order-1 lg:order-2"
        >
          <div className="surface-floating relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-muted sm:aspect-[5/6]">
            {heroImage ? (
              <img src={heroImage} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent">
                <span className="text-sm font-medium tracking-wide text-muted-foreground">{name}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklch,var(--color-foreground)_50%,transparent)] via-transparent to-transparent" />
            <div className="absolute bottom-5 start-5 end-5 sm:bottom-8 sm:start-8 sm:end-8">
              <p className="label-muted text-background/80">
                مشاريع مختارة
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-background)] sm:text-xl">{name}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
