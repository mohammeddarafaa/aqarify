import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useMyReservations } from "@/features/reservation/hooks/use-reservation";
import { Badge } from "@/components/ui/badge";
import { appendTenantSearch } from "@/lib/tenant-path";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "في الانتظار", variant: "secondary" },
  confirmed: { label: "مؤكد", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
  expired: { label: "منتهي", variant: "destructive" },
  /** @deprecated DB may still contain legacy value */
  rejected: { label: "منتهي", variant: "destructive" },
};

export default function ReservationsPage() {
  const { data: reservations = [], isLoading } = useMyReservations();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <>
      <Helmet><title>حجوزاتي</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">حجوزاتي</h1>
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              لا توجد حجوزات بعد. <Link to={withTenant("/browse")} className="text-primary underline">تصفح الوحدات</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الحجز</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => {
                  const status = STATUS_MAP[r.status] ?? { label: r.status, variant: "outline" as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">#{r.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(r.created_at).toLocaleDateString("ar-EG")}
                      </TableCell>
                      <TableCell className="font-medium">{r.total_price.toLocaleString("ar-EG")} ج.م</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
