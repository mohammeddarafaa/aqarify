import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useMyReservations } from "@/features/reservation/hooks/use-reservation";
import { Badge } from "@/components/ui/badge";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useMemo, useState } from "react";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  type ReservationStatusBadgeVariant,
  RESERVATION_STATUS_OPTIONS,
  getReservationStatusLabel,
  getReservationStatusVariant,
} from "@/features/reservations/shared/reservation-status";

const STATUS_MAP: Record<string, { label: string; variant: ReservationStatusBadgeVariant }> = {
  pending: { label: "في الانتظار", variant: "warning" },
  confirmed: { label: "مؤكد", variant: "success" },
  cancelled: { label: "ملغي", variant: "destructive" },
  expired: { label: "منتهي", variant: "muted" },
  /** @deprecated DB may still contain legacy value */
  rejected: { label: "منتهي", variant: "muted" },
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
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">حجوزاتي</h1>
          <p className="text-sm text-muted-foreground">تابع كل حجوزاتك وحالتها من مكان واحد.</p>
        </div>
        <DataTableShell
          columns={[
            {
              header: "رقم الحجز",
              cell: ({ row }) => (
                <span className="font-mono text-xs">
                  #{row.original.id.slice(0, 8).toUpperCase()}
                </span>
              ),
            },
            {
              header: "الحالة",
              cell: ({ row }) => {
                const status = STATUS_MAP[row.original.status] ?? {
                  label: getReservationStatusLabel(row.original.status),
                  variant: getReservationStatusVariant(row.original.status),
                };
                return <Badge variant={status.variant}>{status.label}</Badge>;
              },
            },
            {
              header: "تاريخ الإنشاء",
              cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                  {new Date(row.original.created_at).toLocaleDateString("ar-EG")}
                </span>
              ),
            },
            {
              header: "المبلغ",
              cell: ({ row }) => (
                <span className="font-medium">
                  {row.original.total_price.toLocaleString("ar-EG")} ج.م
                </span>
              ),
            },
          ] satisfies ColumnDef<(typeof reservations)[number]>[]}
          data={isLoading ? [] : filtered}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث برقم الحجز أو المبلغ..."
          filters={[
            {
              key: "status",
              label: "الحالة",
              value: statusFilter,
              onChange: setStatusFilter,
              options: RESERVATION_STATUS_OPTIONS.map((s) => ({
                value: s.value,
                label: s.label,
              })),
            },
          ]}
        />
        {!isLoading && filtered.length === 0 ? (
          <div className="py-2 text-center text-sm text-muted-foreground">
            لا توجد حجوزات مطابقة.{" "}
            <Link to={withTenant("/browse")} className="text-primary underline">
              تصفح الوحدات
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
