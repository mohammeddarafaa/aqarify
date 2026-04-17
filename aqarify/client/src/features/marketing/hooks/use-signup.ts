import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/app-toast";
import { api } from "@/lib/api";

export interface SignupPayload {
  company_name: string;
  slug: string;
  admin_email: string;
  admin_phone: string;
  admin_first_name: string;
  admin_last_name: string;
  plan_code: "starter" | "growth" | "pro";
  billing_cycle: "monthly" | "yearly";
}

export interface SignupResult {
  tenantId: string;
  subscriptionId: string;
  iframeUrl: string;
}

export function useSignup() {
  return useMutation<SignupResult, Error, SignupPayload>({
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Signup failed. Please try again.");
    },
    mutationFn: async (payload) => {
      try {
        const res = await api.post<{ ok: boolean; data: SignupResult }>(
          "/signup",
          payload
        );
        return res.data.data;
      } catch (err) {
        const e = err as {
          response?: { status?: number; data?: { error?: { code?: string; message?: string } } };
        };
        const status = e?.response?.status;
        const code = e?.response?.data?.error?.code;
        const msg = e?.response?.data?.error?.message;
        if (status === 409 || code === "SLUG_TAKEN") {
          throw new Error("That subdomain is already in use. Try another.");
        }
        if (code === "NOT_FOUND") {
          throw new Error(
            "Subscription plans aren't configured yet. Ask an admin to run the SQL bootstrap in Supabase (aqarify_saas_bootstrap.sql).",
          );
        }
        throw new Error(msg ?? "Signup failed. Please try again.");
      }
    },
  });
}

export function useSlugAvailability(slug: string) {
  return useQuery<{ available: boolean }>({
    queryKey: ["marketing", "slug-check", slug],
    queryFn: async () => {
      const res = await api.get<{ ok: boolean; data: { available: boolean } }>(
        `/signup/check-slug/${slug}`
      );
      return res.data.data;
    },
    enabled: slug.length >= 3 && /^[a-z0-9-]+$/.test(slug),
    staleTime: 10_000,
    retry: false,
  });
}
