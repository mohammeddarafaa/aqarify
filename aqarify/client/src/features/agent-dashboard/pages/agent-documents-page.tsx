import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Doc = {
  id: string;
  type: string;
  status: string;
  file_url: string;
  created_at: string;
  users?: { full_name?: string; email?: string };
};

export default function AgentDocumentsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["staff-pending-docs"],
    queryFn: async () => (await api.get("/documents/pending")).data.data,
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      api.patch(`/documents/${id}/review`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-pending-docs"] });
      toast.success("تمت المراجعة");
    },
    onError: () => toast.error("فشلت المراجعة"),
  });

  return (
    <>
      <Helmet><title>مراجعة المستندات</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">مراجعة المستندات</h1>
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">لا توجد مستندات معلقة</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right">العميل</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">الملف</th>
                  <th className="px-4 py-3 text-right">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">{d.users?.full_name ?? d.users?.email ?? "—"}</td>
                    <td className="px-4 py-3">{d.type}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{d.status}</Badge></td>
                    <td className="px-4 py-3"><a className="text-primary underline" href={d.file_url} target="_blank" rel="noreferrer">عرض</a></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => review.mutate({ id: d.id, status: "approved" })} disabled={review.isPending}>قبول</Button>
                        <Button size="sm" variant="destructive" onClick={() => review.mutate({ id: d.id, status: "rejected" })} disabled={review.isPending}>رفض</Button>
                      </div>
                    </td>
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
