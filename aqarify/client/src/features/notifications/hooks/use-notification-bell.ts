import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";

export function useNotificationBell() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      const r = await api.get("/notifications/unread-count");
      return r.data.data as { count: number };
    },
    refetchInterval: 60_000,
    enabled: !!userId,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }, [qc]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, invalidate]);

  return { count: data?.count ?? 0 };
}
