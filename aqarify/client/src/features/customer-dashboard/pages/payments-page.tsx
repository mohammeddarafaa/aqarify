import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CreditCard, Receipt } from "lucide-react";
import { useMemo } from "react";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { appendTenantSearch } from "@/lib/tenant-path";

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

const STATUS_MAP: Record<
  Payment["status"],
  { label: string; variant: "success" | "warning" | "destructive" | "muted" | "outline" }
> = {
  pending: { label: "قادم", variant: "warning" },
  paid: { label: "مدفوع", variant: "success" },
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
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
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

  const filteredPayments = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return payments.filter((payment) => {
      const statusOk = statusFilter === "all" || payment.status === statusFilter;
      const searchOk =
        !query ||
        payment.id.toLowerCase().includes(query) ||
        (TYPE_LABEL[payment.type] ?? payment.type).toLowerCase().includes(query) ||
        String(payment.amount).includes(query);
      return statusOk && searchOk;
    });
  }, [payments, searchValue, statusFilter]);

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

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="mx-auto max-w-md py-14 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-foreground">لا توجد مدفوعات بعد</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              جدول المدفوعات يُنشأ عندما يتحول حجزك إلى{" "}
              <span className="font-medium text-foreground">مؤكّد</span> (بعد إتمام دفع رسوم الحجز عبر المنصة أو تأكيد
              الدفع يدوياً من فريق المبيعات). ما دام الحجز{" "}
              <span className="font-medium text-foreground">في الانتظار</span>، يظهر المبلغ الإجمالي في صفحة
              الحجوزات فقط وليس كسطر مدفوعات هنا.
            </p>
            <Link
              to={withTenant("/reservations")}
              className="mt-6 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
            >
              الانتقال إلى حجوزاتي
            </Link>
          </div>
        ) : (
          <DataTableShell
            columns={[
              {
                header: "النوع",
                cell: ({ row }) => (
                  <span className="font-medium">
                    {TYPE_LABEL[row.original.type] ?? row.original.type}
                  </span>
                ),
              },
              {
                header: "الحالة",
                cell: ({ row }) => (
                  <Badge variant={STATUS_MAP[row.original.status].variant}>
                    {STATUS_MAP[row.original.status].label}
                  </Badge>
                ),
              },
              {
                header: "تاريخ الاستحقاق",
                cell: ({ row }) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.original.due_date).toLocaleDateString("ar-EG")}
                  </span>
                ),
              },
              {
                header: "تاريخ الدفع",
                cell: ({ row }) => (
                  <span className="text-xs text-muted-foreground">
                    {row.original.paid_at
                      ? new Date(row.original.paid_at).toLocaleDateString("ar-EG")
                      : "—"}
                  </span>
                ),
              },
              {
                header: "المبلغ",
                cell: ({ row }) => (
                  <span className="font-medium">
                    {row.original.amount.toLocaleString("ar-EG")} ج.م
                  </span>
                ),
              },
              {
                id: "actions",
                header: "إجراء",
                cell: ({ row }) => (
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {["pending", "overdue"].includes(row.original.status) ? (
                      <Button
                        size="sm"
                        variant={
                          row.original.status === "overdue"
                            ? "destructive"
                            : "default"
                        }
                        className="h-7 text-[11px]"
                        onClick={() => payInstallment.mutate(row.original.id)}
                        disabled={payInstallment.isPending}
                      >
                        {payInstallment.isPending ? "جاري..." : "ادفع الآن"}
                      </Button>
                    ) : null}
                    {row.original.status === "paid" &&
                    row.original.type === "reservation_fee" &&
                    row.original.reservation_id ? (
                      <ReceiptButton reservationId={row.original.reservation_id} />
                    ) : null}
                  </div>
                ),
              },
            ] satisfies ColumnDef<Payment>[]}
            data={filteredPayments}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="ابحث بالمعرّف أو النوع أو المبلغ..."
            filters={[
              {
                key: "status",
                label: "الحالة",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "كل الحالات" },
                  ...Object.entries(STATUS_MAP).map(([value, item]) => ({
                    value,
                    label: item.label,
                  })),
                ],
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
