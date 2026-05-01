import { Link, Outlet } from "react-router-dom";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantTheme } from "@/hooks/use-tenant-theme";
import { useSyncHomeTenantUrl } from "@/hooks/use-sync-home-tenant-url";
import { useAuthStore } from "@/stores/auth.store";
import { ReadOnlyBanner } from "@/components/shared/read-only-banner";
import { isMobileBottomNavAudience, MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { cn } from "@/lib/utils";

export default function PublicLayout() {
  useSyncHomeTenantUrl();
  const { isLoading, tenant, isTenantNotFound, slug } = useTenant();
  useTenantTheme();
  const user = useAuthStore((s) => s.user);
  const reserveBottomNavInset = isMobileBottomNavAudience(user);

  if (isLoading && !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isTenantNotFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">البوابة غير موجودة</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          لا يوجد مطور مرتبط بالرابط <span className="font-mono text-foreground">{slug}</span>.
          تحقق من العنوان أو جرّب الرابط الذي أرسله لك المطوّر.
        </p>
        <Link
          to="/discover"
          className="mt-8 text-sm font-medium tracking-widest uppercase text-foreground underline underline-offset-4"
        >
          تصفّح بوابات أخرى
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReadOnlyBanner />
      <div
        className={cn(
          reserveBottomNavInset &&
            "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0",
        )}
      >
        <Outlet />
      </div>
      <MobileBottomNav />
    </div>
  );
}
