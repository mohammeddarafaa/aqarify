import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { appendTenantSearch } from "@/lib/tenant-path";

type AdminTenantRow = {
  onboarding_completed_at?: string | null;
};

/** Sends new tenant admins through the wizard until POST /admin/onboarding/complete. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();
  const role = user?.role;

  const skip =
    pathname.includes("/admin/onboarding") ||
    pathname.includes("/platform-admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const enabled =
    !skip && !!user && (role === "admin" || role === "super_admin");

  const { data: adminTenant, isFetched, isError } = useQuery<AdminTenantRow>({
    queryKey: ["admin-tenant"],
    queryFn: async () => (await api.get("/admin/tenant")).data.data,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  if (!enabled) return <>{children}</>;

  if (!isFetched && !isError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    isFetched &&
    !isError &&
    adminTenant &&
    adminTenant.onboarding_completed_at == null &&
    !pathname.includes("/admin/onboarding")
  ) {
    return <Navigate to={appendTenantSearch(pathname, search, "/admin/onboarding/company")} replace />;
  }

  return <>{children}</>;
}
