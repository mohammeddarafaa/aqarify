import { useAuthStore } from "@/stores/auth.store";

export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isCustomer = user?.role === "customer";
  const isAgent = user?.role === "agent";
  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  function hasRole(...roles: string[]) {
    return !!user && roles.includes(user.role);
  }

  return { user, isAuthenticated, isCustomer, isAgent, isManager, isAdmin, isSuperAdmin, hasRole };
}
