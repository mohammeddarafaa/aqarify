import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { useMemo, useState } from "react";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSListToolbar } from "@/components/shared/saas-list-toolbar";
import { SaaSTableShell } from "@/components/shared/saas-table-shell";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui-kit";
import {
  RESERVATION_STATUS_OPTIONS,
  getReservationStatusLabel,
  getReservationStatusVariant,
} from "@/features/reservations/shared/reservation-status";

type Reservation = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  users?: { full_name?: string; phone?: string };
  units?: { unit_number?: string };
};

export default function ManagerReservationsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Reservation[] }>({
    queryKey: ["manager-reservations"],
    queryFn: async () => (await api.get("/manager/reservations")).data.data,
  });

  const change = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmed" | "expired" | "cancelled" }) =>
      api.patch(`/manager/reservations/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-reservations"] });
      toast.success("تم تحديث الحجز");
    },
    onError: () => toast.error("فشل التحديث"),
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    return items.filter((r) => {
      const statusOk = statusFilter === "all" || r.status === statusFilter;
      const query = searchValue.trim().toLowerCase();
      const searchOk =
        !query ||
        (r.users?.full_name ?? "").toLowerCase().includes(query) ||
        (r.units?.unit_number ?? "").toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query);
      return statusOk && searchOk;
    });
  }, [items, statusFilter, searchValue]);
  return (
    <>
      <Helmet><title>إدارة الحجوزات</title></Helmet>
      <SaaSPageShell title="إدارة الحجوزات" description="فلترة ومراجعة الحجوزات مع إجراءات سريعة.">
        <SaaSListToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث باسم العميل أو رقم الوحدة..."
          filterLabel="الحالة"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={RESERVATION_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
        <SaaSTableShell
          isLoading={isLoading}
          isEmpty={filtered.length === 0}
          empty={<div className="py-8 text-center text-muted-foreground">لا توجد حجوزات مطابقة.</div>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">العميل</TableHead>
                <TableHead className="text-start">الوحدة</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-start">المبلغ</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.users?.full_name ?? "—"}</TableCell>
                  <TableCell>{r.units?.unit_number ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getReservationStatusVariant(r.status)}>
                      {getReservationStatusLabel(r.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.total_price?.toLocaleString("ar-EG")} ج.م</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => change.mutate({ id: r.id, status: "confirmed" })} disabled={change.isPending}>تأكيد</Button>
                      <Button size="sm" variant="destructive" onClick={() => change.mutate({ id: r.id, status: "expired" })} disabled={change.isPending}>إنهاء</Button>
                      <Button size="sm" variant="outline" onClick={() => change.mutate({ id: r.id, status: "cancelled" })} disabled={change.isPending}>إلغاء</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SaaSTableShell>
      </SaaSPageShell>
    </>
  );
}
