import { Link, Outlet } from "react-router-dom";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantTheme } from "@/hooks/use-tenant-theme";
import { useSyncHomeTenantUrl } from "@/hooks/use-sync-home-tenant-url";
import { ReadOnlyBanner } from "@/components/shared/read-only-banner";

export default function PublicLayout() {
  useSyncHomeTenantUrl();
  const { isLoading, tenant, isTenantNotFound, slug } = useTenant();
  useTenantTheme();

  if (isLoading && !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isTenantNotFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-2xl font-semibold text-[#141414]">البوابة غير موجودة</h1>
        <p className="mt-3 max-w-md text-sm text-[#666666]">
          لا يوجد مطور مرتبط بالرابط <span className="font-mono text-[#141414]">{slug}</span>.
          تحقق من العنوان أو جرّب الرابط الذي أرسله لك المطوّر.
        </p>
        <Link
          to="/discover"
          className="mt-8 text-sm font-medium tracking-widest uppercase text-[#141414] underline underline-offset-4"
        >
          تصفّح بوابات أخرى
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <ReadOnlyBanner />
      <Outlet />
    </div>
  );
}
