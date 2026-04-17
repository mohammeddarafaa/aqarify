import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Waitlist = {
  id: string;
  position: number;
  status: string;
  preferred_type?: string;
  max_budget?: number;
  units?: { unit_number?: string; type?: string };
  projects?: { name?: string };
};

export default function WaitlistPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Waitlist | null>({
    queryKey: ["customer-waitlist"],
    queryFn: async () => (await api.get("/waiting-list/my")).data.data,
  });

  const leave = useMutation({
    mutationFn: async () => api.delete("/waiting-list/my"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-waitlist"] });
      toast.success("تم إلغاء الاشتراك من قائمة الانتظار");
    },
    onError: () => toast.error("فشل تنفيذ العملية"),
  });

  return (
    <>
      <Helmet><title>قائمة الانتظار</title></Helmet>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">قائمة الانتظار</h1>
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
        ) : !data ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">لا يوجد اشتراك فعال في قائمة الانتظار حاليا</div>
        ) : (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">موقعك الحالي</p>
                <p className="text-3xl font-bold">#{data.position}</p>
              </div>
              <Badge variant="outline">{data.status}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <p>الوحدة: {data.units?.unit_number ?? "—"}</p>
              <p>المشروع: {data.projects?.name ?? "—"}</p>
              <p>النوع المفضل: {data.preferred_type ?? "—"}</p>
              <p>الميزانية: {data.max_budget ? `${data.max_budget.toLocaleString("ar-EG")} ج.م` : "—"}</p>
            </div>
            <Button variant="destructive" onClick={() => leave.mutate()} disabled={leave.isPending}>
              {leave.isPending ? "جاري التنفيذ..." : "إلغاء الاشتراك"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
