import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import {
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Phone,
  Building2,
  FileText,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit";
import { useIsReadOnly } from "@/hooks/use-is-read-only";
import { useAuthStore } from "@/stores/auth.store";
import { useState } from "react";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSListToolbar } from "@/components/shared/saas-list-toolbar";
import { SaaSTableShell } from "@/components/shared/saas-table-shell";
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

  return (
    <>
      <Helmet>
        <title>الحجوزات</title>
      </Helmet>
      <SaaSPageShell title="إدارة الحجوزات" description="راجع الحجوزات وأدر الحالات بسرعة ودقة.">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>المعلقة: <strong className="text-foreground">{counts.pending ?? 0}</strong></span>
          <span>المؤكدة: <strong className="text-foreground">{counts.confirmed ?? 0}</strong></span>
        </div>

        <SaaSListToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث باسم العميل أو الهاتف أو الوحدة..."
          filterLabel="الحالة"
          filterValue={status}
          onFilterChange={setStatus}
          filterOptions={RESERVATION_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />

        <SaaSTableShell
          isLoading={isLoading}
          isEmpty={visibleItems.length === 0}
          empty={
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">لا توجد حجوزات لعرضها</p>
            </div>
          }
        >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-start">العميل</TableHead>
                  <TableHead className="text-start hidden md:table-cell">
                    الوحدة
                  </TableHead>
                  <TableHead className="text-start">الحالة</TableHead>
                  <TableHead className="text-start hidden sm:table-cell">
                    التاريخ
                  </TableHead>
                  <TableHead className="text-start">المبلغ</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {initials(r.users?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {r.users?.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Phone className="h-3 w-3" />
                            {r.users?.phone ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {r.units?.unit_number ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.units?.project?.name ?? r.units?.type ?? ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getReservationStatusVariant(r.status)}>
                        {getReservationStatusLabel(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {r.total_price?.toLocaleString("ar-EG")} ج.م
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={readOnly || r.status !== "pending"}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canConfirmOrExpire ? (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus.mutate({
                                  id: r.id,
                                  newStatus: "confirmed",
                                })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              تأكيد الحجز
                            </DropdownMenuItem>
                          ) : null}
                          {canConfirmOrExpire ? <DropdownMenuSeparator /> : null}
                          {canConfirmOrExpire ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                updateStatus.mutate({
                                  id: r.id,
                                  newStatus: "expired",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4" />
                              إنهاء الحجز
                            </DropdownMenuItem>
                          ) : null}
                          {canConfirmOrExpire ? <DropdownMenuSeparator /> : null}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              updateStatus.mutate({
                                id: r.id,
                                newStatus: "cancelled",
                              })
                            }
                          >
                            <XCircle className="h-4 w-4" />
                            إلغاء الحجز
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
