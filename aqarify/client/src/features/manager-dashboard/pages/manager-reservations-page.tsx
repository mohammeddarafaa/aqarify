import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableShell } from "@/components/shared/data-table-shell";
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
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">إدارة الحجوزات</h1>
          <p className="text-sm text-muted-foreground">فلترة ومراجعة الحجوزات مع إجراءات سريعة.</p>
        </div>
        <DataTableShell
          columns={[
            {
              header: "العميل",
              cell: ({ row }) => row.original.users?.full_name ?? "—",
            },
            {
              header: "الوحدة",
              cell: ({ row }) => row.original.units?.unit_number ?? "—",
            },
            {
              header: "الحالة",
              cell: ({ row }) => (
                <Badge variant={getReservationStatusVariant(row.original.status)}>
                  {getReservationStatusLabel(row.original.status)}
                </Badge>
              ),
            },
            {
              header: "المبلغ",
              cell: ({ row }) =>
                `${row.original.total_price?.toLocaleString("ar-EG")} ج.م`,
            },
            {
              id: "actions",
              header: "إجراءات",
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      change.mutate({ id: row.original.id, status: "confirmed" })
                    }
                    disabled={change.isPending}
                  >
                    تأكيد
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      change.mutate({ id: row.original.id, status: "expired" })
                    }
                    disabled={change.isPending}
                  >
                    إنهاء
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      change.mutate({ id: row.original.id, status: "cancelled" })
                    }
                    disabled={change.isPending}
                  >
                    إلغاء
                  </Button>
                </div>
              ),
            },
          ] satisfies ColumnDef<Reservation>[]}
          data={isLoading ? [] : filtered}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث باسم العميل أو رقم الوحدة..."
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
      </div>
    </>
  );
}
