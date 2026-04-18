import axios from "axios";
import { toast } from "@/lib/app-toast";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { resolveTenantSlug } from "@/lib/host";

let lastNetworkToastAt = 0;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const user = useAuthStore.getState().user;

  // Logged-in tenant members must send their *home* tenant slug. The tenant store
  // often reflects `?tenant=` / browse context and can disagree with users.tenant_id,
  // which causes403 "Cross-tenant access denied" on manager/agent/admin routes.
  const tenantSlug =
    token && user?.tenant_slug
      ? user.tenant_slug
      : useTenantStore.getState().tenant?.slug ??
        user?.tenant_slug ??
        resolveTenantSlug();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) config.headers["x-tenant-slug"] = tenantSlug;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }

    if (!err.response && typeof navigator !== "undefined") {
      if (navigator.onLine) {
        const now = Date.now();
        if (now - lastNetworkToastAt > 5000) {
          lastNetworkToastAt = now;
          toast.error("Couldn't reach the server. Check your connection.");
        }
      }
    }

    return Promise.reject(err);
  }
);
