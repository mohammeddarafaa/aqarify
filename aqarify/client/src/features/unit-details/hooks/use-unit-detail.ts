import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Unit } from "@/features/browse/types";
import type { ApiSuccess } from "@/types/api.types";

export function useUnitDetail(id: string) {
  return useQuery<Unit>({
    queryKey: ["unit", id],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Unit>>(`/units/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}
