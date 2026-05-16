import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";

/**
 * T2-I — Realtime Notification Bell
 *
 * Replaces the 60-second polling interval with a Supabase Realtime subscription
 * scoped to `notifications` WHERE user_id = current user.
 *
 * On INSERT the query cache is invalidated, which causes a lightweight
 * unread-count refetch (~1 request for a single integer).
 *
 * The Realtime channel is torn down on unmount to avoid zombie subscriptions.
 */
export function useNotificationBell() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      const r = await api.get("/notifications/unread-count");
      return r.data.data as { count: number };
    },
    // Keep a short stale time so a hard refresh always reflects reality,
    // but Realtime is the primary delivery mechanism.
    staleTime: 30_000,
    enabled: !!userId,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }, [qc]);

  useEffect(() => {
    if (!userId) return;

    // Unique channel name per user+mount to avoid duplicate subscriptions on
    // React StrictMode double-invoke.
    const channelId = `notif:bell:${userId}:${Math.random().toString(36).slice(2, 8)}`;

    const channel = supabase
      .channel(channelId)
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Sync count immediately after channel connects in case we missed
          // events during the subscribe handshake.
          invalidate();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, invalidate]);

  return { count: data?.count ?? 0 };
}
