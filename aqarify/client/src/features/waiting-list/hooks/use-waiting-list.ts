import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface WaitlistEntry {
  id: string;
  unit_id: string;
  position: number;
  status: string;
  expires_at?: string | null;
  preferred_type?: string;
  max_budget?: number;
  notes?: string;
  created_at: string;
  units?: { unit_number?: string; type?: string; projects?: { name?: string } | null };
}

const WAITLIST_KEYS = ["my-waitlist-entries", "waiting-list-my", "customer-waitlist"] as const;

function invalidateWaitlist(qc: ReturnType<typeof useQueryClient>) {
  WAITLIST_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useMyWaitingEntries() {
  return useQuery<WaitlistEntry[]>({
    queryKey: ["my-waitlist-entries"],
    queryFn: async () => (await api.get("/waiting-list/my")).data.data,
  });
}

/** Prefer {@link useMyWaitingEntries} — customers may be on multiple unit waitlists. */
/** Waitlist row for a specific unit (customers may hold multiple waitlist spots). */
export function useMyWaitingEntry(unitId: string) {
  const q = useMyWaitingEntries();
  return {
    ...q,
    data: q.data?.find((e) => e.unit_id === unitId) ?? null,
  };
}

export function useJoinWaitingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      unit_id?: string;
      project_id?: string;
      preferred_type?: string;
      max_budget?: number;
      notes?: string;
    }) => {
      const res = await api.post("/waiting-list", payload);
      return res.data.data;
    },
    onSuccess: () => invalidateWaitlist(qc),
  });
}

export function useJoinWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { unitId: string; sms: boolean; email: boolean }) => {
      const res = await api.post("/waiting-list", {
        unit_id: payload.unitId,
        notification_prefs: { sms: payload.sms, email: payload.email },
      });
      return res.data.data as { position: number };
    },
    onSuccess: () => invalidateWaitlist(qc),
    onError: (err: any) => {
      import("@/lib/app-toast").then(({ toast }) => {
        toast.error(err.response?.data?.error?.message ?? "Failed to join waitlist. Please try again.");
      });
    },
  });
}

export function useLeaveWaitingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId?: string) => {
      const q = unitId ? `?unit_id=${unitId}` : "";
      await api.delete(`/waiting-list/my${q}`);
    },
    onSuccess: () => invalidateWaitlist(qc),
  });
}
