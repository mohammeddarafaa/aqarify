import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTableShell } from "@/components/shared/data-table-shell";

const STATUS_OPTIONS = ["available", "reserved", "sold", "unavailable"] as const;
const UNIT_TYPES = ["apartment", "duplex", "villa", "office", "retail"] as const;
const STATUS_LABELS: Record<string, string> = { available: "متاح", reserved: "محجوز", sold: "مباع", unavailable: "غير متاح" };

type Unit = {
  id: string;
  project_id: string;
  unit_number: string;
  type: string;
  floor: number;
  size_sqm: number;
  price: number;
  reservation_fee?: number;
  gallery?: string[];
  status: string;
  projects?: { name: string };
};

type FormData = {
  project_id: string;
  unit_number: string;
  type: string;
  floor: string;
  size_sqm: string;
  price: string;
  reservation_fee: string;
};

const emptyForm: FormData = {
  project_id: "",
  unit_number: "",
  type: "apartment",
  floor: "1",
  size_sqm: "",
  price: "",
  reservation_fee: "",
};

export default function ManagerUnitsPage() {
  const qc = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [createForm, setCreateForm] = useState<FormData>(emptyForm);
  const [editForm, setEditForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-units"],
    queryFn: async () => (await api.get("/manager/units")).data.data as { total: number; items: Unit[] },
  });
  const { data: projects = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["manager-projects"],
    queryFn: async () => (await api.get("/manager/projects")).data.data,
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/manager/units/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-units"] });
      toast.success("تم تحديث الحالة");
    },
    onError: () => toast.error("فشل التحديث"),
  });

  const createUnit = useMutation({
    mutationFn: async (payload: FormData) =>
      api.post("/manager/units", {
        project_id: payload.project_id,
        unit_number: payload.unit_number,
        type: payload.type,
        floor: Number(payload.floor),
        size_sqm: Number(payload.size_sqm),
        price: Number(payload.price),
        reservation_fee: Number(payload.reservation_fee || 0),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-units"] });
      setOpenCreate(false);
      setCreateForm(emptyForm);
      toast.success("تمت إضافة الوحدة");
    },
    onError: () => toast.error("فشل إضافة الوحدة"),
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FormData }) =>
      api.patch(`/manager/units/${id}`, {
        project_id: payload.project_id,
        unit_number: payload.unit_number,
        type: payload.type,
        floor: Number(payload.floor),
        size_sqm: Number(payload.size_sqm),
        price: Number(payload.price),
        reservation_fee: Number(payload.reservation_fee || 0),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-units"] });
      setEditingUnit(null);
      toast.success("تم تعديل الوحدة");
    },
    onError: () => toast.error("فشل تعديل الوحدة"),
  });

  function startEdit(unit: Unit) {
    setEditingUnit(unit);
    setEditForm({
      project_id: unit.project_id,
      unit_number: unit.unit_number,
      type: unit.type || "apartment",
      floor: String(unit.floor ?? 1),
      size_sqm: String(unit.size_sqm ?? ""),
      price: String(unit.price ?? ""),
      reservation_fee: String(unit.reservation_fee ?? ""),
    });
  }

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return items.filter((u) => {
      const statusOk = statusFilter === "all" || u.status === statusFilter;
      const searchOk =
        !query ||
        u.unit_number.toLowerCase().includes(query) ||
        (u.projects?.name ?? "").toLowerCase().includes(query) ||
        u.type.toLowerCase().includes(query);
      return statusOk && searchOk;
    });
  }, [items, searchValue, statusFilter]);

  return (
    <>
      <Helmet><title>إدارة الوحدات</title></Helmet>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{`الوحدات (${data?.total ?? 0})`}</h1>
          <p className="text-sm text-muted-foreground">قائمة موحدة للوحدات مع فلترة سريعة وإجراءات تحويل مباشرة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setOpenCreate(true)}>إضافة وحدة</Button>
        </div>
        <DataTableShell
          columns={useMemo<ColumnDef<Unit>[]>(
            () => [
              {
                accessorKey: "unit_number",
                header: "رقم الوحدة",
                cell: ({ row }) => <span className="font-medium">{row.original.unit_number}</span>,
              },
              {
                id: "project_name",
                accessorFn: (row) => row.projects?.name ?? "—",
                header: "المشروع",
                cell: ({ row }) => row.original.projects?.name ?? "—",
              },
              {
                accessorKey: "type",
                header: "النوع",
                cell: ({ row }) => row.original.type,
              },
              {
                accessorKey: "floor",
                header: "الطابق",
                cell: ({ row }) => row.original.floor,
              },
              {
                accessorKey: "size_sqm",
                header: "المساحة",
                cell: ({ row }) => `${row.original.size_sqm} م²`,
                meta: {
                  csvValue: (row: Unit) => `${row.size_sqm} م²`,
                },
              },
              {
                accessorKey: "price",
                header: "السعر",
                cell: ({ row }) => `${row.original.price?.toLocaleString("ar-EG")} ج.م`,
                meta: {
                  csvValue: (row: Unit) =>
                    `${row.price?.toLocaleString("ar-EG") ?? ""} ج.م`,
                },
              },
              {
                accessorKey: "status",
                header: "الحالة",
                cell: ({ row }) => (
                  <Badge
                    variant={
                      row.original.status === "available"
                        ? "default"
                        : row.original.status === "reserved"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {STATUS_LABELS[row.original.status] ?? row.original.status}
                  </Badge>
                ),
                meta: {
                  csvValue: (row: Unit) =>
                    STATUS_LABELS[row.status] ?? row.status,
                },
              },
              {
                id: "actions",
                header: "إجراءات",
                enableHiding: false,
                cell: ({ row }) => (
                  <div className="flex gap-2">
                    <Select
                      value={row.original.status}
                      onValueChange={(v) =>
                        changeStatus.mutate({ id: row.original.id, status: v })
                      }
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(row.original)}
                    >
                      تعديل
                    </Button>
                  </div>
                ),
              },
            ],
            [changeStatus],
          )}
          data={isLoading ? [] : filtered}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث برقم الوحدة أو المشروع أو النوع..."
          exportFileName="units"
          filters={[
            {
              key: "status",
              label: "الحالة",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "كل الحالات" },
                ...STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: STATUS_LABELS[s],
                })),
              ],
            },
          ]}
        />
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة وحدة جديدة</DialogTitle>
            <DialogDescription>أدخل الحد الأدنى من البيانات لنشر الوحدة سريعاً ثم أكمل التفاصيل لاحقاً.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المشروع</Label>
              <Select value={createForm.project_id} onValueChange={(v) => setCreateForm((p) => ({ ...p, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>رقم الوحدة</Label><Input value={createForm.unit_number} onChange={(e) => setCreateForm((p) => ({ ...p, unit_number: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={createForm.type} onValueChange={(v) => setCreateForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>الطابق</Label><Input type="number" value={createForm.floor} onChange={(e) => setCreateForm((p) => ({ ...p, floor: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>المساحة (م²)</Label><Input type="number" value={createForm.size_sqm} onChange={(e) => setCreateForm((p) => ({ ...p, size_sqm: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>السعر</Label><Input type="number" value={createForm.price} onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>رسوم الحجز</Label><Input type="number" value={createForm.reservation_fee} onChange={(e) => setCreateForm((p) => ({ ...p, reservation_fee: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={() => createUnit.mutate(createForm)} disabled={createUnit.isPending || !createForm.project_id || !createForm.unit_number}>
              {createUnit.isPending ? "جاري الحفظ..." : "حفظ الوحدة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!editingUnit} onOpenChange={(v) => !v && setEditingUnit(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>تعديل الوحدة</SheetTitle>
            <SheetDescription>حدّث بيانات الوحدة مع الحفاظ على تجربة تحرير سريعة ومباشرة.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-4">
            <div className="space-y-1.5">
              <Label>المشروع</Label>
              <Select value={editForm.project_id} onValueChange={(v) => setEditForm((p) => ({ ...p, project_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>رقم الوحدة</Label><Input value={editForm.unit_number} onChange={(e) => setEditForm((p) => ({ ...p, unit_number: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>الطابق</Label><Input type="number" value={editForm.floor} onChange={(e) => setEditForm((p) => ({ ...p, floor: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>المساحة (م²)</Label><Input type="number" value={editForm.size_sqm} onChange={(e) => setEditForm((p) => ({ ...p, size_sqm: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>السعر</Label><Input type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>رسوم الحجز</Label><Input type="number" value={editForm.reservation_fee} onChange={(e) => setEditForm((p) => ({ ...p, reservation_fee: e.target.value }))} /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingUnit(null)}>إلغاء</Button>
              <Button
                onClick={() => editingUnit && updateUnit.mutate({ id: editingUnit.id, payload: editForm })}
                disabled={updateUnit.isPending}
              >
                {updateUnit.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
