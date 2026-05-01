import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { CheckCircle2, XCircle, MoreHorizontal, Phone, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsReadOnly } from "@/hooks/use-is-read-only";
import { useAuthStore } from "@/stores/auth.store";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  RESERVATION_STATUS_OPTIONS,
  getReservationStatusLabel,
  getReservationStatusVariant,
} from "@/features/reservations/shared/reservation-status";

type ReservationItem = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  units?: { unit_number: string; type: string; project?: { name: string } };
  users?: { full_name: string; email: string; phone: string };
};

function initials(name?: string | null) {
  if (!name) return "؟";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AgentReservationsPage() {
  const [status, setStatus] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const qc = useQueryClient();
  const readOnly = useIsReadOnly();
  const userRole = useAuthStore((s) => s.user?.role);
  const canConfirmOrExpire = userRole && ["manager", "admin", "super_admin"].includes(userRole);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-reservations", status],
    queryFn: async () => {
      const params = status && status !== "all" ? `?status=${status}` : "";
      const r = await api.get(`/agent/reservations${params}`);
      return r.data.data as { items: ReservationItem[] };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: string;
    }) => {
      await api.patch(`/agent/reservations/${id}/status`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-reservations"] });
      toast.success("تم التحديث");
    },
    onError: () => toast.error("فشل التحديث"),
  });

  const items = data?.items ?? [];
  const visibleItems = items.filter((r) => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.users?.full_name ?? "").toLowerCase().includes(q) ||
      (r.users?.phone ?? "").includes(q) ||
      (r.units?.unit_number ?? "").toLowerCase().includes(q)
    );
  });
  const counts = items.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const columns = useMemo<ColumnDef<ReservationItem>[]>(
    () => [
      {
        header: "العميل",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                  {initials(r.users?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{r.users?.full_name ?? "—"}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {r.users?.phone ?? "—"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        header: "الوحدة",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-medium">{r.units?.unit_number ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.units?.project?.name ?? r.units?.type ?? ""}
                </p>
              </div>
            </div>
          );
        },
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
        header: "التاريخ",
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("ar-EG"),
      },
      {
        header: "المبلغ",
        cell: ({ row }) => `${row.original.total_price?.toLocaleString("ar-EG")} ج.م`,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={readOnly || r.status !== "pending"}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canConfirmOrExpire ? (
                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: r.id, newStatus: "confirmed" })}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    تأكيد الحجز
                  </DropdownMenuItem>
                ) : null}
                {canConfirmOrExpire ? <DropdownMenuSeparator /> : null}
                {canConfirmOrExpire ? (
                  <DropdownMenuItem variant="destructive" onClick={() => updateStatus.mutate({ id: r.id, newStatus: "expired" })}>
                    <XCircle className="h-4 w-4" />
                    إنهاء الحجز
                  </DropdownMenuItem>
                ) : null}
                {canConfirmOrExpire ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem variant="destructive" onClick={() => updateStatus.mutate({ id: r.id, newStatus: "cancelled" })}>
                  <XCircle className="h-4 w-4" />
                  إلغاء الحجز
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canConfirmOrExpire, readOnly, updateStatus],
  );

  return (
    <>
      <Helmet>
        <title>الحجوزات</title>
      </Helmet>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">إدارة الحجوزات</h1>
          <p className="text-sm text-muted-foreground">راجع الحجوزات وأدر الحالات بسرعة ودقة.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>المعلقة: <strong className="text-foreground">{counts.pending ?? 0}</strong></span>
          <span>المؤكدة: <strong className="text-foreground">{counts.confirmed ?? 0}</strong></span>
        </div>
        <DataTableShell
          columns={columns}
          data={isLoading ? [] : visibleItems}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث باسم العميل أو الهاتف أو الوحدة..."
          filters={[{
            key: "status",
            label: "الحالة",
            value: status,
            onChange: setStatus,
            options: RESERVATION_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
          }]}
        />
      </div>
    </>
  );
}
