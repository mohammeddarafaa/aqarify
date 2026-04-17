import { Link, useLocation } from "react-router-dom";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export interface BrowseHeroProps {
  total: number;
  isLoading: boolean;
}

/**
 * Tenant-branded hero strip shown above the browse grid.
 * - Uses tenant.logo_url / theme if configured, otherwise falls back to
 *   the tenant name on a neutral strip so every tenant reads as itself.
 */
export function BrowseHero({ total, isLoading }: BrowseHeroProps) {
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const name = tenant?.name ?? "المطور";
  const area = tenant?.address ?? "مصر";
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={name}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#141414] text-sm font-semibold uppercase tracking-widest text-white">
              {name.slice(0, 2)}
            </div>
          )}
          <div>
            <p className="label-overline text-[var(--color-muted-foreground)]">
              وحدات {name}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#141414] md:text-4xl">
              اكتشف وحداتك في {area}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#666]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {area}
              </span>
              {tenant?.contact_phone ? (
                <a
                  href={`tel:${tenant.contact_phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#141414]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {tenant.contact_phone}
                </a>
              ) : null}
              {!isLoading && total > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[#888]">
                  · {total} وحدة متاحة
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Link
          to={withTenant("/#contact")}
          className="inline-flex items-center gap-2 self-start text-[11px] font-medium uppercase tracking-widest text-[#141414] hover:opacity-60 md:self-end"
        >
          استفسر عن وحدة
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        </Link>
      </div>
    </section>
  );
}
