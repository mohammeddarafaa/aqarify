import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  cn,
} from "@/components/ui-kit";
import { Button as HeroButton } from "@heroui/react";
import { usePublicProjects } from "@/features/browse/hooks/use-public-projects";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export function DiscoveryFeaturedCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const { data: projects, isLoading } = usePublicProjects();
  const list = (projects ?? []).slice(0, 12);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="bg-[#0a0a0a] py-20 text-white">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
              مميز
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              مشاريع من {tenant?.name ?? "المطور"}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/55">
              اختر مشروعًا لعرض الوحدات المتاحة والحجز.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <HeroButton
              variant="secondary"
              size="md"
              className="rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md"
              isIconOnly
              aria-label="السابق"
              onPress={() => scrollBy(-360)}
            >
              <ChevronRight className="size-5" />
            </HeroButton>
            <HeroButton
              variant="secondary"
              size="md"
              className="rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md"
              isIconOnly
              aria-label="التالي"
              onPress={() => scrollBy(360)}
            >
              <ChevronLeft className="size-5" />
            </HeroButton>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
            >
              <Link to={withTenant("/browse")}>كل المشاريع</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden pb-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[22rem] w-72 shrink-0 rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="pb-4 text-sm text-white/50">لا توجد مشاريع منشورة بعد.</p>
        ) : (
          <div
            ref={scrollerRef}
            className={cn(
              "flex gap-4 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none]",
              "[&::-webkit-scrollbar]:hidden",
            )}
          >
            {list.map((p) => {
              const img =
                p.cover_image_url ??
                p.gallery?.[0] ??
                `https://placehold.co/640x800/1a1a1a/888888?text=${encodeURIComponent(p.name)}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(withTenant(`/browse/projects/${p.id}`))}
                  className="group w-[min(100%,280px)] shrink-0 text-start"
                >
                  <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-none transition-transform duration-300 hover:-translate-y-1">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span
                        className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm"
                        aria-hidden
                      >
                        <Building2 className="size-4" />
                      </span>
                      <Badge className="absolute bottom-3 start-3 rounded-md border-0 bg-white text-[11px] font-semibold text-[#141414]">
                        مشروع
                      </Badge>
                    </div>
                    <CardContent className="space-y-1 p-4">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                        {p.address ? "موقع مميز" : "مشروع سكني"}
                      </p>
                      <p className="line-clamp-2 text-sm font-semibold text-white">{p.name}</p>
                      {p.address ? (
                        <p className="flex items-center gap-1 text-xs text-white/50">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{p.address}</span>
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
