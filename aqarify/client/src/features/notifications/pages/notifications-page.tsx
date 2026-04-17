import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationList } from "@/components/motion/notification-list";

const TYPE_ICONS: Record<string, string> = {
  reservation_confirmed: "✅", reservation_rejected: "❌",
  payment_due: "💰", payment_received: "🎉", waiting_list_unit: "🔔",
  general: "📢",
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => { const r = await api.get("/notifications"); return r.data.data; },
  });

  const markAll = useMutation({
    mutationFn: async () => { await api.post("/notifications/mark-all-read"); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-notifications"] }); },
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/notifications/${id}/read`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-notifications"] }); },
  });

  return (
    <>
      <Helmet><title>الإشعارات</title></Helmet>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" />الإشعارات</h1>
          {(data?.items ?? []).some((n: { is_read: boolean }) => !n.is_read) && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} className="gap-2">
              <CheckCheck className="h-4 w-4" />تعليم الكل كمقروء
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div>
            <NotificationList items={(data?.items ?? []).map((n: { id: string; type: string; title: string; body: string; is_read: boolean; created_at: string }) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              is_read: n.is_read,
              created_at: n.created_at,
              icon: TYPE_ICONS[n.type] ?? "📢",
              onClick: !n.is_read ? () => markOne.mutate(n.id) : undefined,
            }))} />
            {(data?.items ?? []).length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد إشعارات بعد</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
