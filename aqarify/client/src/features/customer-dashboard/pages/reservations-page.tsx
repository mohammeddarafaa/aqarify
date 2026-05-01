import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useMyReservations } from "@/features/reservation/hooks/use-reservation";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui-kit";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useMemo, useState } from "react";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSListToolbar } from "@/components/shared/saas-list-toolbar";
import { SaaSTableShell } from "@/components/shared/saas-table-shell";
import {
  RESERVATION_STATUS_OPTIONS,
  getReservationStatusLabel,
  getReservationStatusVariant,
} from "@/features/reservations/shared/reservation-status";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "في الانتظار", variant: "secondary" },
  confirmed: { label: "مؤكد", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
  expired: { label: "منتهي", variant: "destructive" },
  /** @deprecated DB may still contain legacy value */
  rejected: { label: "منتهي", variant: "destructive" },
};

export default function ReservationsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: reservations = [], isLoading } = useMyReservations();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const statusOk = statusFilter === "all" || r.status === statusFilter;
      const query = searchValue.trim().toLowerCase();
      const searchOk =
        !query ||
        r.id.toLowerCase().includes(query) ||
        String(r.total_price).includes(query);
      return statusOk && searchOk;
    });
  }, [reservations, searchValue, statusFilter]);

  return (
    <>
      <Helmet><title>حجوزاتي</title></Helmet>
      <SaaSPageShell title="حجوزاتي" description="تابع كل حجوزاتك وحالتها من مكان واحد.">
        <SaaSListToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث برقم الحجز أو المبلغ..."
          filterLabel="الحالة"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={RESERVATION_STATUS_OPTIONS.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
        <SaaSTableShell
          isLoading={isLoading}
          isEmpty={filtered.length === 0}
          empty={
            <div className="py-8 text-center text-muted-foreground">
              لا توجد حجوزات مطابقة.{" "}
              <Link to={withTenant("/browse")} className="text-primary underline">
                تصفح الوحدات
              </Link>
            </div>
          }
        >
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
                {filtered.map((r) => {
                  const status = STATUS_MAP[r.status] ?? {
                    label: getReservationStatusLabel(r.status),
                    variant: getReservationStatusVariant(r.status),
                  };
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
        </SaaSTableShell>
      </SaaSPageShell>
    </>
  );
}
