import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Reservation = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  users?: { full_name?: string; phone?: string };
  units?: { unit_number?: string };
};

export default function ManagerReservationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Reservation[] }>({
    queryKey: ["manager-reservations"],
    queryFn: async () => (await api.get("/manager/reservations")).data.data,
  });

  const change = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmed" | "rejected" | "cancelled" }) =>
      api.patch(`/manager/reservations/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-reservations"] });
      toast.success("تم تحديث الحجز");
    },
    onError: () => toast.error("فشل التحديث"),
  });

  const items = data?.items ?? [];
  return (
    <>
      <Helmet><title>إدارة الحجوزات</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">إدارة الحجوزات</h1>
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">لا توجد حجوزات</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right">العميل</th>
                  <th className="px-4 py-3 text-right">الوحدة</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">المبلغ</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.users?.full_name ?? "—"}</td>
                    <td className="px-4 py-3">{r.units?.unit_number ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={r.status === "confirmed" ? "default" : r.status === "pending" ? "secondary" : "outline"}>{r.status}</Badge></td>
                    <td className="px-4 py-3">{r.total_price?.toLocaleString("ar-EG")} ج.م</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => change.mutate({ id: r.id, status: "confirmed" })} disabled={change.isPending}>تأكيد</Button>
                        <Button size="sm" variant="destructive" onClick={() => change.mutate({ id: r.id, status: "rejected" })} disabled={change.isPending}>رفض</Button>
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
