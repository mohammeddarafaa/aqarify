import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type LogItem = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  users?: { full_name?: string; email?: string; role?: string };
};

export default function ActivityLogsPage() {
  const { data = [], isLoading } = useQuery<LogItem[]>({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => (await api.get("/activity-logs?limit=100")).data.data,
  });

  return (
    <>
      <Helmet><title>سجل النشاط</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">سجل النشاط</h1>
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">لا توجد سجلات نشاط</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">الإجراء</th>
                  <th className="px-4 py-3 text-right">الكيان</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">{l.users?.full_name ?? l.users?.email ?? "—"}</td>
                    <td className="px-4 py-3">{l.action}</td>
                    <td className="px-4 py-3">{l.entity_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
