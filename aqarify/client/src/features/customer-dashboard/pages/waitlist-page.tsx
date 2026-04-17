import { Helmet } from "react-helmet-async";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyWaitingEntries } from "@/features/waiting-list/hooks/use-waiting-list";

const STATUS_LABEL: Record<string, string> = {
  waiting: "في الانتظار",
  active: "في الانتظار",
  notified: "تم الإشعار",
  expired: "انتهت المدة",
  cancelled: "ملغي",
  removed: "ملغي",
  converted: "تم التحويل",
};

export default function WaitlistPage() {
  const qc = useQueryClient();
  const { data: entries = [], isLoading } = useMyWaitingEntries();

  const leave = useMutation({
    mutationFn: async (unitId: string) => api.delete(`/waiting-list/my?unit_id=${unitId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-waitlist-entries"] });
      toast.success("تم إلغاء الاشتراك من قائمة الانتظار");
    },
    onError: () => toast.error("فشل تنفيذ العملية"),
  });

  return (
    <>
      <Helmet>
        <title>قائمة الانتظار</title>
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">قائمة الانتظار ({entries.length})</h1>
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            لا يوجد اشتراك فعال في قائمة الانتظار حاليا
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-xl border bg-card p-5"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                  #{entry.position}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {entry.units?.unit_number ?? "—"}
                    {entry.units?.projects?.name ? ` — ${entry.units.projects.name}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {STATUS_LABEL[entry.status] ?? entry.status}
                    </Badge>
                    {entry.expires_at && entry.status === "notified" && (
                      <span className="text-xs font-medium text-orange-600">
                        ينتهي: {new Date(entry.expires_at).toLocaleString("ar-EG")}
                      </span>
                    )}
                  </div>
                </div>
                {entry.status === "waiting" || entry.status === "active" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => leave.mutate(entry.unit_id)}
                    disabled={leave.isPending}
                  >
                    إلغاء
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
