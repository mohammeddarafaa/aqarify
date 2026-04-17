import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const loginTo = appendTenantSearch(location.pathname, location.search, "/login");
    return <Navigate to={loginTo} state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const unauthorizedTo = appendTenantSearch(location.pathname, location.search, "/unauthorized");
    return <Navigate to={unauthorizedTo} replace />;
  }

  return <>{children}</>;
}
