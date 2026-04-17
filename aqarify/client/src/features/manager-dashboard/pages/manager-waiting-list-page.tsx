import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock } from "lucide-react";

export default function ManagerWaitingListPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["manager-waiting-list"],
    queryFn: async () => { const r = await api.get("/manager/waiting-list"); return r.data.data; },
  });

  return (
    <>
      <Helmet><title>قائمة الانتظار</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Clock className="h-6 w-6" />قائمة الانتظار ({(data as unknown[]).length})</h1>
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div className="space-y-3">
            {(data as { id: string; position: number; preferred_type?: string; max_budget?: number; notes?: string; created_at: string; users?: { full_name: string; email: string; phone: string } }[]).map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 rounded-xl border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  #{entry.position}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{entry.users?.full_name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{entry.users?.phone} | {entry.users?.email}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    {entry.preferred_type && <span>نوع: {entry.preferred_type}</span>}
                    {entry.max_budget && <span>ميزانية: {entry.max_budget.toLocaleString("ar-EG")} ج.م</span>}
                  </div>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{new Date(entry.created_at).toLocaleDateString("ar-EG")}</p>
              </div>
            ))}
            {(data as unknown[]).length === 0 && <p className="text-center text-muted-foreground py-12">قائمة الانتظار فارغة</p>}
          </div>
        )}
      </div>
    </>
  );
}
