import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = ["available", "reserved", "sold", "unavailable"] as const;
const UNIT_TYPES = ["apartment", "duplex", "villa", "office", "retail"] as const;
const STATUS_LABELS: Record<string, string> = {
  available: "متاح", reserved: "محجوز", sold: "مباع", unavailable: "غير متاح",
};
const STATUS_COLORS: Record<string, string> = {
  available: "text-green-700 bg-green-50", reserved: "text-yellow-700 bg-yellow-50",
  sold: "text-blue-700 bg-blue-50", unavailable: "text-red-700 bg-red-50",
};

export default function ManagerUnitsPage() {
  const qc = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [createGallery, setCreateGallery] = useState<string[]>([]);
  const [editGallery, setEditGallery] = useState<string[]>([]);
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);

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
  const [createForm, setCreateForm] = useState<FormData>(emptyForm);
  const [editForm, setEditForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-units"],
    queryFn: async () => { const r = await api.get("/manager/units"); return r.data.data; },
  });
  const { data: projects = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["manager-projects"],
    queryFn: async () => (await api.get("/manager/projects")).data.data,
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/manager/units/${id}/status`, { status });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manager-units"] }); toast.success("تم تحديث الحالة"); setUpdating(null); },
    onError: () => toast.error("فشل التحديث"),
  });

  const createUnit = useMutation({
    mutationFn: async (payload: FormData) => {
      await api.post("/manager/units", {
        project_id: payload.project_id,
        unit_number: payload.unit_number,
        type: payload.type,
        floor: Number(payload.floor),
        size_sqm: Number(payload.size_sqm),
        price: Number(payload.price),
        reservation_fee: Number(payload.reservation_fee || 0),
        gallery: createGallery,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-units"] });
      setOpenCreate(false);
      setCreateForm(emptyForm);
      setCreateGallery([]);
      toast.success("تمت إضافة الوحدة");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        ?? "فشل إضافة الوحدة";
      toast.error(message);
    },
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FormData }) => {
      await api.patch(`/manager/units/${id}`, {
        project_id: payload.project_id,
        unit_number: payload.unit_number,
        type: payload.type,
        floor: Number(payload.floor),
        size_sqm: Number(payload.size_sqm),
        price: Number(payload.price),
        reservation_fee: Number(payload.reservation_fee || 0),
        gallery: editGallery,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-units"] });
      setEditing(null);
      setEditGallery([]);
      toast.success("تم تعديل الوحدة");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        ?? "فشل تعديل الوحدة";
      toast.error(message);
    },
  });

  function startEdit(unit: Unit) {
    setEditing(unit.id);
    setEditForm({
      project_id: unit.project_id,
      unit_number: unit.unit_number,
      type: unit.type || "apartment",
      floor: String(unit.floor ?? 1),
      size_sqm: String(unit.size_sqm ?? ""),
      price: String(unit.price ?? ""),
      reservation_fee: String(unit.reservation_fee ?? ""),
    });
    setEditGallery(unit.gallery ?? []);
  }

  async function uploadImage(file: File, unitId?: string) {
    const fd = new FormData();
    fd.append("file", file);
    if (unitId) fd.append("unit_id", unitId);
    const res = await api.post("/manager/units/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data.publicUrl as string;
  }

  return (
    <>
      <Helmet><title>إدارة الوحدات</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">الوحدات ({data?.total ?? 0})</h1>
          <Button onClick={() => setOpenCreate((v) => !v)}>{openCreate ? "إغلاق" : "إضافة وحدة"}</Button>
        </div>

        {openCreate && (
          <div className="rounded-xl border bg-card p-4 grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>المشروع</Label>
              <select className="h-9 w-full rounded border px-2 text-sm" value={createForm.project_id} onChange={(e) => setCreateForm((p) => ({ ...p, project_id: e.target.value }))}>
                <option value="">اختر المشروع</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>رقم الوحدة</Label><Input value={createForm.unit_number} onChange={(e) => setCreateForm((p) => ({ ...p, unit_number: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>النوع</Label>
              <select className="h-9 w-full rounded border px-2 text-sm" value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}>
                {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>الطابق</Label><Input type="number" value={createForm.floor} onChange={(e) => setCreateForm((p) => ({ ...p, floor: e.target.value }))} /></div>
            <div className="space-y-1"><Label>المساحة (م²)</Label><Input type="number" value={createForm.size_sqm} onChange={(e) => setCreateForm((p) => ({ ...p, size_sqm: e.target.value }))} /></div>
            <div className="space-y-1"><Label>السعر</Label><Input type="number" value={createForm.price} onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))} /></div>
            <div className="space-y-1"><Label>رسوم الحجز</Label><Input type="number" value={createForm.reservation_fee} onChange={(e) => setCreateForm((p) => ({ ...p, reservation_fee: e.target.value }))} /></div>
            <div className="space-y-1 md:col-span-2">
              <Label>صور الوحدة</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploadingCreate(true);
                  try {
                    const url = await uploadImage(f);
                    setCreateGallery((p) => [...p, url]);
                    toast.success("تم رفع الصورة");
                  } catch {
                    toast.error("فشل رفع الصورة");
                  } finally {
                    setUploadingCreate(false);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {createGallery.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {createGallery.map((url) => (
                    <div key={url} className="relative">
                      <img src={url} alt="unit" className="h-14 w-14 rounded object-cover border" />
                      <button type="button" onClick={() => setCreateGallery((p) => p.filter((x) => x !== url))} className="absolute -top-2 -right-2 text-[10px] rounded-full bg-destructive text-white h-4 w-4">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-end"><Button className="w-full" onClick={() => createUnit.mutate(createForm)} disabled={createUnit.isPending || uploadingCreate || !createForm.project_id || !createForm.unit_number}>حفظ الوحدة</Button></div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["رقم الوحدة", "النوع", "الطابق", "المساحة", "السعر", "الحالة", "إجراءات"].map((h) => (
                    <th key={h} className="px-4 py-3 text-right font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.items ?? []).map((unit: Unit) => (
                  <tr key={unit.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{unit.unit_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{unit.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{unit.floor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{unit.size_sqm} م²</td>
                    <td className="px-4 py-3 font-medium">{unit.price?.toLocaleString("ar-EG")} ج.م</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[unit.status])}>
                        {STATUS_LABELS[unit.status] ?? unit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editing === unit.id ? (
                        <div className="grid gap-2">
                          <select className="rounded border text-xs px-2 py-1" value={editForm.project_id} onChange={(e) => setEditForm((p) => ({ ...p, project_id: e.target.value }))}>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <Input className="h-7 text-xs" value={editForm.unit_number} onChange={(e) => setEditForm((p) => ({ ...p, unit_number: e.target.value }))} />
                          <Input className="h-7 text-xs" type="number" value={editForm.floor} onChange={(e) => setEditForm((p) => ({ ...p, floor: e.target.value }))} />
                          <Input className="h-7 text-xs" type="number" value={editForm.size_sqm} onChange={(e) => setEditForm((p) => ({ ...p, size_sqm: e.target.value }))} />
                          <Input className="h-7 text-xs" type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} />
                          <Input
                            className="h-7 text-xs"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setUploadingEdit(true);
                              try {
                                const url = await uploadImage(f, unit.id);
                                setEditGallery((p) => [...p, url]);
                              } catch {
                                toast.error("فشل رفع الصورة");
                              } finally {
                                setUploadingEdit(false);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                          {editGallery.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {editGallery.map((url) => (
                                <img key={url} src={url} alt="unit" className="h-8 w-8 rounded object-cover border" />
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <button onClick={() => updateUnit.mutate({ id: unit.id, payload: editForm })}
                              className="text-xs text-primary underline hover:no-underline" disabled={uploadingEdit}>حفظ</button>
                            <button onClick={() => setEditing(null)}
                              className="text-xs text-muted-foreground underline hover:no-underline">إلغاء</button>
                          </div>
                        </div>
                      ) : updating === unit.id ? (
                        <select className="rounded border text-xs px-2 py-1"
                          defaultValue={unit.status}
                          onChange={(e) => changeStatus.mutate({ id: unit.id, status: e.target.value })}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setUpdating(unit.id)}
                            className="text-xs text-primary underline hover:no-underline">الحالة</button>
                          <button onClick={() => startEdit(unit)}
                            className="text-xs text-primary underline hover:no-underline">تعديل</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
