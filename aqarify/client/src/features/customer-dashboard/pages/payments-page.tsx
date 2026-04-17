import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Payment = {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  paid_at?: string | null;
  status: "pending" | "paid" | "overdue" | "failed";
};

const STATUS_MAP: Record<Payment["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قادم", variant: "secondary" },
  paid: { label: "مدفوع", variant: "default" },
  overdue: { label: "متأخر", variant: "destructive" },
  failed: { label: "فشل", variant: "destructive" },
};

export default function PaymentsPage() {
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["customer-payments"],
    queryFn: async () => {
      const res = await api.get("/payments");
      return res.data.data;
    },
  });

  return (
    <>
      <Helmet><title>مدفوعاتي</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">مدفوعاتي</h1>
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">لا توجد مدفوعات بعد</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>تاريخ الدفع</TableHead>
                  <TableHead>المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.type === "installment" ? "قسط" : p.type}</TableCell>
                    <TableCell><Badge variant={STATUS_MAP[p.status].variant}>{STATUS_MAP[p.status].label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.due_date).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString("ar-EG") : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{p.amount.toLocaleString("ar-EG")} ج.م</TableCell>
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
