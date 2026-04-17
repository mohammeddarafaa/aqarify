import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SubscriptionStatusResp {
  status: "pending_payment" | "active" | "past_due" | "expired" | "cancelled";
  tenant_slug: string | null;
}

// NOTE: polled from the post-checkout page. Endpoint is intentionally scoped
// to just the fields the pending customer needs to see (no RLS bypass).
export function useSubscriptionStatus(subscriptionId: string | null) {
  return useQuery<SubscriptionStatusResp>({
    queryKey: ["subscription-status", subscriptionId],
    queryFn: async () => {
      const res = await api.get<{ ok: boolean; data: SubscriptionStatusResp }>(
        `/subscription/status/${subscriptionId}`
      );
      return res.data.data;
    },
    enabled: !!subscriptionId,
    refetchInterval: (q) =>
      q.state.data?.status === "active" ? false : 3000,
    retry: false,
  });
}
