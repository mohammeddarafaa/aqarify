import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlanFeatures {
  custom_domain?: boolean;
  white_label?: boolean;
  api_access?: boolean;
  priority_support?: boolean;
  reports?: boolean;
  map_view?: boolean;
}

export interface Plan {
  id: string;
  code: "starter" | "growth" | "pro";
  name: string;
  description: string | null;
  price_egp_monthly: number;
  price_egp_yearly: number;
  max_units: number;
  max_users: number;
  max_projects: number;
  features: PlanFeatures;
  sort_order: number;
}

// Marketing-site fallback. Used whenever the backend /plans endpoint is
// unreachable or the `subscription_plans` table hasn't been migrated yet,
// so the pricing UI is never empty in front of a prospect.
const FALLBACK_PLANS: Plan[] = [
  {
    id: "fallback-starter",
    code: "starter",
    name: "Starter",
    description: "For a single project getting started with online sales.",
    price_egp_monthly: 2_500,
    price_egp_yearly: 25_000,
    max_units: 50,
    max_users: 3,
    max_projects: 1,
    features: { map_view: true },
    sort_order: 1,
  },
  {
    id: "fallback-growth",
    code: "growth",
    name: "Growth",
    description: "For developers with multiple projects and a sales team.",
    price_egp_monthly: 6_500,
    price_egp_yearly: 65_000,
    max_units: 500,
    max_users: 15,
    max_projects: 5,
    features: {
      map_view: true,
      reports: true,
      custom_domain: true,
      priority_support: true,
    },
    sort_order: 2,
  },
  {
    id: "fallback-pro",
    code: "pro",
    name: "Pro",
    description: "Unlimited units, white-label, and an API for your stack.",
    price_egp_monthly: 14_000,
    price_egp_yearly: 140_000,
    max_units: 99999,
    max_users: 99999,
    max_projects: 99999,
    features: {
      map_view: true,
      reports: true,
      custom_domain: true,
      priority_support: true,
      white_label: true,
      api_access: true,
    },
    sort_order: 3,
  },
];

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["marketing", "plans"],
    queryFn: async () => {
      try {
        const res = await api.get<{ ok: boolean; data: Plan[] }>("/plans");
        const live = res.data?.data;
        return live && live.length > 0 ? live : FALLBACK_PLANS;
      } catch {
        return FALLBACK_PLANS;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
