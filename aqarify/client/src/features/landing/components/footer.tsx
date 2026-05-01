import { Link, useLocation } from "react-router-dom";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export function Footer() {
  const tenant = useTenantStore((s) => s.tenant);
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background/45 border-t border-background/10">
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <p className="text-[13px] font-bold tracking-widest text-background uppercase">
              {tenant?.name ?? "المطور"}
            </p>
            <p className="text-[9px] font-medium tracking-[0.2em] text-background/35 uppercase mt-1">
              {tenant?.address ?? "Real Estate Platform"}
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {[
              { label: "مشاريعنا", to: "/browse" },
              { label: "تواصل معنا", to: "/#contact" },
              { label: "تسجيل الدخول", to: "/login" },
              { label: "حجز وحدة", to: "/browse" },
            ].map(({ label, to }) => (
              <Link key={to + label} to={withTenant(to)}
                className="text-[10px] font-medium tracking-widest uppercase text-background/45 hover:text-background/75 transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-[10px] tracking-widest uppercase whitespace-nowrap">
            © {year} {tenant?.name ?? "المطور"}
          </p>
        </div>
      </div>
    </footer>
  );
}
