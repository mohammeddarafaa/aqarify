import { useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenantStore } from "@/stores/tenant.store";
import { api } from "@/lib/api";
import type { Tenant } from "@/stores/tenant.store";
import { useTenantSlug } from "@/hooks/use-tenant-slug";
import { resolveTenantUiConfig } from "@/lib/tenant-ui-config";

export function useTenant() {
  const { setTenant, setLoading, clearTenant, tenant } = useTenantStore();
  const slug = useTenantSlug();

  const query = useQuery<Tenant>({
    queryKey: ["tenant", slug],
    queryFn: async () => {
      const res = await api.get<{ ok: boolean; data: Tenant }>(
        `/tenants/by-slug/${slug}`
      );
      const tenant = res.data.data;
      return { ...tenant, tenant_ui_config: resolveTenantUiConfig(tenant) };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useLayoutEffect(() => {
    if (!slug) {
      clearTenant();
      return;
    }
    if (query.isPending) {
      setLoading(true);
      return;
    }
    if (query.data) {
      setTenant(query.data);
      return;
    }
    if (query.isError) {
      clearTenant();
    }
  }, [slug, query.data, query.isPending, query.isError, setTenant, setLoading, clearTenant]);

  const resolvedTenant = query.data ?? tenant;
  const isTenantNotFound =
    !!slug && query.isFetched && !query.isPending && query.data == null;

  return {
    tenant: resolvedTenant,
    slug,
    isLoading: !!slug && !resolvedTenant && query.isPending,
    error: query.error,
    isTenantNotFound,
  };
}
