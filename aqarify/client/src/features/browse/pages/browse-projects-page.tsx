import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/features/landing/components/navbar";
import { BrowseHero } from "@/features/browse/components/browse-hero";
import { usePublicProjects } from "@/features/browse/hooks/use-public-projects";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Skeleton } from "@/components/ui-kit";
import { MapPin } from "lucide-react";
import { LocationDiscoveryOnboarding } from "@/features/browse/components/location-discovery-onboarding";

function projectHref(pathname: string, search: string, projectId: string) {
  return appendTenantSearch(pathname, search, `/browse/projects/${projectId}`);
}

export default function BrowseProjectsPage() {
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const { data: projects, isLoading } = usePublicProjects();
  const list = projects ?? [];

  return (
    <>
      <Helmet>
        <title>مشاريع {tenant?.name ?? "المطور"} — اختر مشروعًا</title>
        <meta
          name="description"
          content={`تصفّح مشاريع ${tenant?.name ?? "المطور"} ثم اختر الوحدة المناسبة.`}
        />
      </Helmet>
      <Navbar />

      <main className="min-h-screen bg-white pt-20">
        <BrowseHero mode="projects" total={list.length} isLoading={isLoading} />

        <div className="mx-auto max-w-screen-xl px-6 py-10">
          <LocationDiscoveryOnboarding projects={list} />
          <p className="label-overline mb-6 text-[var(--color-muted-foreground)]">المشاريع</p>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">لا توجد مشاريع منشورة بعد.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => {
                const cover =
                  p.cover_image_url ??
                  p.gallery?.[0] ??
                  tenant?.logo_url ??
                  null;
                return (
                  <Link
                    key={p.id}
                    to={projectHref(pathname, search, p.id)}
                    className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {cover ? (
                        <img
                          src={cover}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent text-sm text-muted-foreground">
                          {p.name}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-5">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">{p.name}</h2>
                      {p.address ? (
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{p.address}</span>
                        </p>
                      ) : null}
                      <span className="label-overline inline-block">
                        عرض الوحدات ←
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
