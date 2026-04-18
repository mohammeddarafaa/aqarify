import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin, Search, Star } from "lucide-react";
import { Button, Card, CardContent, Avatar, AvatarFallback, ShimmeringText } from "@/components/ui-kit";
import { Chip, Surface } from "@heroui/react";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import { usePublicProjects } from "@/features/browse/hooks/use-public-projects";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80";

export function DiscoveryHero() {
  const tenant = useTenantStore((s) => s.tenant);
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const name = tenant?.name ?? "المطور";
  const area = tenant?.address ?? "مصر";

  const { data: projects, isLoading: projectsLoading } = usePublicProjects();
  const projectCount = projects?.length ?? 0;

  const statPrimary = projectsLoading ? "—" : projectCount > 0 ? `${projectCount}` : "جديد";
  const statSecondary = "مصر";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-white pt-20">
      <div className="relative mx-auto grid max-w-screen-xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pb-20 lg:pt-10">
        <div className="order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 flex flex-wrap gap-2"
          >
            <Chip size="sm" variant="soft" color="accent">
              بوابة حجز رسمية
            </Chip>
            <Chip size="sm" variant="secondary" color="default">
              دفع آمن
            </Chip>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="label-overline mb-4 text-[var(--color-muted-foreground)]"
          >
            <ShimmeringText text={`${name} · ${area}`} />
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="display-xl max-w-xl text-balance text-[#141414]"
          >
            اكتشف مشاريعنا
            <br />
            <span className="text-[#141414]/85">ثم وحداتك — احجز بخطوات واضحة</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-[#666666]"
          >
            تصفّح المشاريع، قارن الأسعار والمساحات، واحجز عبر منصة موثوقة مع متابعة لحالة طلبك
            في أي وقت.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="mt-8"
          >
            <Card className="rounded-3xl border-[var(--color-border)] shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm text-[#141414]">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="mt-10 flex flex-col gap-6 border-t border-[var(--color-border)] pt-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-10">
              <div>
                <p className="text-3xl font-bold tracking-tight text-[#141414]">{statPrimary}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#888888]">
                  مشاريع منشورة
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-[#141414]">{statSecondary}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#888888]">
                  تغطية
                </p>
              </div>
            </div>

            <Surface
              variant="secondary"
              className="flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white/90 p-3 shadow-sm backdrop-blur-sm"
            >
              <Avatar className="size-11 border border-[var(--color-border)]">
                <AvatarFallback className="bg-[#141414] text-xs font-semibold text-white">
                  AQ
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-start">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-xs leading-snug text-[#555555]">
                  «تجربة حجز سلسة وواجهة واضحة — أنصح بها لأي مستثمر.»
                </p>
              </div>
            </Surface>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:order-2"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[#f0f0f0] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.18)] sm:aspect-[5/6]">
            <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-5 start-5 end-5 sm:bottom-8 sm:start-8 sm:end-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
                مشاريع مختارة
              </p>
              <p className="mt-1 text-lg font-semibold text-white sm:text-xl">{name}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
