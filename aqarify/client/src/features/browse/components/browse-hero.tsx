import { Link, useLocation } from "react-router-dom";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export type BrowseHeroMode = "projects" | "units";

export interface BrowseHeroProps {
  mode: BrowseHeroMode;
  total: number;
  isLoading: boolean;
  /** When `mode === "units"`, shown as the primary context line. */
  projectName?: string | null;
}

/**
 * Tenant-branded hero strip above browse (projects index or units within a project).
 */
export function BrowseHero({ mode, total, isLoading, projectName }: BrowseHeroProps) {
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const name = tenant?.name ?? "المطور";
  const area = tenant?.address ?? "مصر";
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const isProjects = mode === "projects";
  const labelOverline = isProjects ? `مشاريع ${name}` : projectName ? `مشروع ${projectName}` : `وحدات ${name}`;
  const title = isProjects
    ? `اختر مشروعًا في ${area}`
    : projectName
      ? `وحدات ${projectName}`
      : `اكتشف وحداتك في ${area}`;
  const countLine =
    !isLoading && total > 0
      ? isProjects
        ? `${total} مشروعًا`
        : `${total} وحدة`
      : null;

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={name} className="h-12 w-auto object-contain" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#141414] text-sm font-semibold uppercase tracking-widest text-white">
              {name.slice(0, 2)}
            </div>
          )}
          <div>
            <p className="label-overline text-[var(--color-muted-foreground)]">{labelOverline}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#141414] md:text-4xl">{title}</h1>
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
              {countLine ? (
                <span className="inline-flex items-center gap-1.5 text-[#888]">· {countLine}</span>
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
