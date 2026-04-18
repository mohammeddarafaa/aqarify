import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.types";

export interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  cover_image_url: string | null;
  gallery: string[] | null;
  status: string;
}

export function usePublicProjects() {
  return useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => (await api.get<ApiSuccess<PublicProject[]>>("/projects")).data.data,
  });
}

export function usePublicProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["public-project", projectId],
    enabled: Boolean(projectId),
    retry: false,
    queryFn: async () =>
      (await api.get<ApiSuccess<PublicProject & { buildings?: unknown[] }>>(`/projects/${projectId}`))
        .data.data,
  });
}
