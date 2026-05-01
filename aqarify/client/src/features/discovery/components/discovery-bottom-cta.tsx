import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui-kit";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useTenantUi } from "@/hooks/use-tenant-ui";

export function DiscoveryBottomCta() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const { ui } = useTenantUi();

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/50 py-16">
      <div className="mx-auto max-w-screen-xl px-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-[#141414] sm:text-3xl">
          {ui?.content.cta_title ?? "نساعدك على إتمام خطوة الحجز بثقة"}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[#666666]">
          {ui?.content.cta_description ??
            "ابدأ بتصفّح المشاريع ثم الوحدات، أو تواصل مع فريق المبيعات من صفحة التواصل."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button className="rounded-full px-8" onClick={() => navigate(withTenant("/browse"))}>
            استكشف الآن
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#141414] bg-transparent">
            <Link to={withTenant("/#contact")}>تواصل معنا</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
