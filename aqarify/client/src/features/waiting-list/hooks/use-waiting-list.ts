import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface WaitingEntry {
  id: string;
  position: number;
  status: string;
  preferred_type?: string;
  max_budget?: number;
  notes?: string;
  created_at: string;
}

export function useMyWaitingEntry() {
  return useQuery<WaitingEntry | null>({
    queryKey: ["waiting-list-my"],
    queryFn: async () => {
      const res = await api.get("/waiting-list/my");
      return res.data.data;
    },
  });
}

export function useJoinWaitingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      unit_id?: string; project_id?: string;
      preferred_type?: string; max_budget?: number; notes?: string;
    }) => {
      const res = await api.post("/waiting-list", payload);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waiting-list-my"] }),
  });
}

// Alias with unit-specific API signature used by the modal
export function useJoinWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { unitId: string; tenantId: string; sms: boolean; email: boolean }) => {
      const res = await api.post("/waiting-list", {
        unit_id: payload.unitId,
        notification_prefs: { sms: payload.sms, email: payload.email },
      });
      return res.data.data as { position: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waiting-list-my"] }),
  });
}

export function useLeaveWaitingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await api.delete("/waiting-list/my"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waiting-list-my"] }),
  });
}
