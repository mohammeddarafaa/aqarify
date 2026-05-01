import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.types";
import { useTenantSlug } from "@/hooks/use-tenant-slug";

export interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  cover_image_url: string | null;
  gallery: string[] | null;
  status: string;
  starting_price?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

export function usePublicProjects() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: ["public-projects", tenantSlug],
    queryFn: async () => (await api.get<ApiSuccess<PublicProject[]>>("/projects")).data.data,
  });
}

export function usePublicProject(projectId: string | undefined) {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: ["public-project", tenantSlug, projectId],
    enabled: Boolean(projectId),
    retry: false,
    queryFn: async () =>
      (await api.get<ApiSuccess<PublicProject & { buildings?: unknown[] }>>(`/projects/${projectId}`))
        .data.data,
  });
}
