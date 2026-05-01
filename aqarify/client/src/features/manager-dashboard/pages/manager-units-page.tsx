import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import {
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSListToolbar } from "@/components/shared/saas-list-toolbar";
import { SaaSTableShell } from "@/components/shared/saas-table-shell";

const STATUS_OPTIONS = ["available", "reserved", "sold", "unavailable"] as const;
const UNIT_TYPES = ["apartment", "duplex", "villa", "office", "retail"] as const;
const STATUS_LABELS: Record<string, string> = { available: "متاح", reserved: "محجوز", sold: "مباع", unavailable: "غير متاح" };
type UnitStatus = (typeof STATUS_OPTIONS)[number];

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
      <SaaSPageShell
        title={`الوحدات (${data?.total ?? 0})`}
        description="قائمة موحدة للوحدات مع فلترة سريعة وإجراءات تحويل مباشرة."
      >
        <SaaSListToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث برقم الوحدة أو المشروع أو النوع..."
          filterLabel="الحالة"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "all", label: "كل الحالات" },
            ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          ]}
          actionLabel="إضافة وحدة"
          onActionClick={() => setOpenCreate(true)}
        />
        <SaaSTableShell
          isLoading={isLoading}
          isEmpty={filtered.length === 0}
          empty={<div className="py-8 text-center text-muted-foreground">لا توجد وحدات مطابقة للفلاتر.</div>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">رقم الوحدة</TableHead>
                <TableHead className="text-start">المشروع</TableHead>
                <TableHead className="text-start">النوع</TableHead>
                <TableHead className="text-start">الطابق</TableHead>
                <TableHead className="text-start">المساحة</TableHead>
                <TableHead className="text-start">السعر</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_number}</TableCell>
                  <TableCell>{unit.projects?.name ?? "—"}</TableCell>
                  <TableCell>{unit.type}</TableCell>
                  <TableCell>{unit.floor}</TableCell>
                  <TableCell>{unit.size_sqm} م²</TableCell>
                  <TableCell>{unit.price?.toLocaleString("ar-EG")} ج.م</TableCell>
                  <TableCell>
                    <Badge variant={unit.status === "available" ? "default" : unit.status === "reserved" ? "secondary" : "outline"}>
                      {STATUS_LABELS[unit.status] ?? unit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={unit.status}
                        onValueChange={(v) => changeStatus.mutate({ id: unit.id, status: v })}
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
                      <Button size="sm" variant="outline" onClick={() => startEdit(unit)}>
                        تعديل
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SaaSTableShell>
      </SaaSPageShell>

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
