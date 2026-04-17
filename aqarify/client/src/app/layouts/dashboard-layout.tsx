import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useTenantTheme } from "@/hooks/use-tenant-theme";
import { useTenant } from "@/hooks/use-tenant";
import { useAuthStore } from "@/stores/auth.store";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { ReadOnlyBanner } from "@/components/shared/read-only-banner";
import { appendTenantSearch } from "@/lib/tenant-path";

export default function DashboardLayout() {
  const { isLoading } = useTenant();
  useTenantTheme();
  const { isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname, search } = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={appendTenantSearch(pathname, search, "/login")} replace />;
  }
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <ReadOnlyBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
