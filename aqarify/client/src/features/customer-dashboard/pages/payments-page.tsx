import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, CreditCard, Receipt } from "lucide-react";

type Payment = {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  paid_at?: string | null;
  status: "pending" | "paid" | "overdue" | "failed";
  reservation_id?: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  reservation_fee: "رسوم الحجز",
  down_payment: "دفعة أولى",
  installment: "قسط",
};

const STATUS_MAP: Record<Payment["status"], {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  pending: { label: "قادم", variant: "secondary" },
  paid: { label: "مدفوع", variant: "default" },
  overdue: { label: "متأخر", variant: "destructive" },
  failed: { label: "فشل", variant: "destructive" },
};

function ReceiptButton({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reservations/${reservationId}/receipt`);
      const { receipt_url } = res.data.data as { receipt_url: string };
      window.open(receipt_url, "_blank", "noopener");
    } catch {
      toast.error("الإيصال غير متاح بعد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      onClick={handleDownload}
      disabled={loading}
      title="تنزيل الإيصال"
    >
      <Download className="h-3.5 w-3.5" />
      إيصال
    </Button>
  );
}

export default function PaymentsPage() {
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["customer-payments"],
    queryFn: async () => {
      const res = await api.get("/payments");
      return res.data.data;
    },
  });

  const payInstallment = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await api.post(`/payments/${paymentId}/pay-intent`);
      return res.data.data as { payment_key: string; iframe_id: string | null };
    },
    onSuccess: (data) => {
      if (data.payment_key && data.iframe_id) {
        window.location.href = `https://accept.paymob.com/api/acceptance/iframes/${data.iframe_id}?payment_token=${data.payment_key}`;
      } else {
        toast.error("لم يتم إعداد بوابة الدفع. تواصل مع المبيعات.");
      }
    },
    onError: () => toast.error("فشل بدء الدفع. حاول مرة أخرى."),
  });

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDue = payments
    .filter((p) => ["pending", "overdue"].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <Helmet><title>مدفوعاتي</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">مدفوعاتي</h1>

        {/* Summary cards */}
        {!isLoading && payments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="h-4 w-4" /> إجمالي المدفوع
              </div>
              <p className="text-xl font-bold">{totalPaid.toLocaleString("ar-EG")} ج.م</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" /> المتبقي
              </div>
              <p className="text-xl font-bold">{totalDue.toLocaleString("ar-EG")} ج.م</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                إجمالي الأقساط
              </div>
              <p className="text-xl font-bold">{payments.length}</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-14 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد مدفوعات بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>تاريخ الدفع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead className="text-center">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {TYPE_LABEL[p.type] ?? p.type}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_MAP[p.status].variant}>
                        {STATUS_MAP[p.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.due_date).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString("ar-EG") : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.amount.toLocaleString("ar-EG")} ج.م
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {["pending", "overdue"].includes(p.status) && (
                          <Button
                            size="sm"
                            variant={p.status === "overdue" ? "destructive" : "default"}
                            className="h-7 text-[11px]"
                            onClick={() => payInstallment.mutate(p.id)}
                            disabled={payInstallment.isPending}
                          >
                            {payInstallment.isPending ? "جاري..." : "ادفع الآن"}
                          </Button>
                        )}
                        {/* Receipt download for reservation fee payments */}
                        {p.status === "paid" && p.type === "reservation_fee" && p.reservation_id && (
                          <ReceiptButton reservationId={p.reservation_id} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
