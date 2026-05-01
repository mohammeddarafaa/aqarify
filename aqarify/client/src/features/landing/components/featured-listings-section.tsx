import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/shared/property-card";
import { usePublicProjects } from "@/features/browse/hooks/use-public-projects";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

/** Legacy-style carousel; tenant home uses DiscoveryFeaturedCarousel instead. */
export function FeaturedListingsSection() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const { data: projects, isLoading } = usePublicProjects();
  const list = (projects ?? []).slice(0, 8);

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="label-overline mb-2">مشاريع مميزة</p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl" style={{ letterSpacing: "-0.02em" }}>
              أبرز المشاريع من {tenant?.name ?? "المطور"}
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to={withTenant("/browse")}>عرض الكل</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[28rem] w-72 shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {list.slice(0, 6).map((project) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-[2rem] text-start outline-none transition-opacity hover:opacity-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => navigate(withTenant(`/browse/projects/${project.id}`))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(withTenant(`/browse/projects/${project.id}`));
                  }
                }}
              >
                <PropertyCard
                  title={project.name}
                  price={project.starting_price ? `${project.starting_price.toLocaleString("ar-EG")} ج.م` : "اسأل عن السعر"}
                  imageUrl={
                    project.cover_image_url ??
                    project.gallery?.[0] ??
                    `https://placehold.co/600x800/f5f5f5/888888?text=${encodeURIComponent(project.name)}`
                  }
                  beds={3}
                  baths={2}
                  area={1450}
                  sharePath={withTenant(`/browse/projects/${project.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
