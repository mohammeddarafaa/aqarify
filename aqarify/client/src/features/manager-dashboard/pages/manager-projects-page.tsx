import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Project = {
  id: string;
  name: string;
  address?: string;
  description?: string;
  cover_image_url?: string;
  status: "active" | "inactive";
};

type FormData = {
  name: string;
  address: string;
  description: string;
  status: "active" | "inactive";
  cover_image_url: string;
};

const EMPTY: FormData = {
  name: "",
  address: "",
  description: "",
  status: "active",
  cover_image_url: "",
};

export default function ManagerProjectsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["manager-projects-crud"],
    queryFn: async () => (await api.get("/manager/projects")).data.data,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        await api.patch(`/projects/${editing}`, form);
      } else {
        await api.post("/projects", form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-projects-crud"] });
      qc.invalidateQueries({ queryKey: ["manager-projects"] });
      setEditing(null);
      setForm(EMPTY);
      toast.success(editing ? "تم تعديل المشروع" : "تمت إضافة المشروع");
    },
    onError: () => toast.error("فشل حفظ المشروع"),
  });

  async function uploadCover(file: File, projectId?: string) {
    const fd = new FormData();
    fd.append("file", file);
    if (projectId) fd.append("project_id", projectId);
    const res = await api.post("/manager/projects/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setForm((p) => ({ ...p, cover_image_url: res.data.data.publicUrl }));
  }

  return (
    <>
      <Helmet><title>إدارة المشاريع</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">إدارة المشاريع</h1>

        <div className="rounded-xl border bg-card p-4 grid gap-3 md:grid-cols-4">
          <div className="space-y-1"><Label>اسم المشروع</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-1"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
          <div className="space-y-1"><Label>الحالة</Label><select className="h-9 w-full rounded border px-2 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}><option value="active">active</option><option value="inactive">inactive</option></select></div>
          <div className="space-y-1"><Label>وصف مختصر</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="space-y-1 md:col-span-2">
            <Label>صورة المشروع</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  await uploadCover(f, editing ?? undefined);
                  toast.success("تم رفع الصورة");
                } catch {
                  toast.error("فشل رفع الصورة");
                } finally {
                  setUploading(false);
                  e.currentTarget.value = "";
                }
              }}
            />
            {form.cover_image_url ? <img src={form.cover_image_url} alt="cover" className="mt-2 h-16 w-24 rounded object-cover border" /> : null}
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending || uploading || !form.name}>{editing ? "تحديث المشروع" : "إضافة مشروع"}</Button>
            {editing ? <Button variant="outline" onClick={() => { setEditing(null); setForm(EMPTY); }}>إلغاء</Button> : null}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">لا توجد مشاريع</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right">الصورة</th>
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">العنوان</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.cover_image_url ? <img src={p.cover_image_url} alt={p.name} className="h-10 w-16 rounded object-cover border" /> : "—"}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.address ?? "—"}</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setEditing(p.id);
                          setForm({
                            name: p.name ?? "",
                            address: p.address ?? "",
                            description: p.description ?? "",
                            status: p.status ?? "active",
                            cover_image_url: p.cover_image_url ?? "",
                          });
                        }}
                        className="text-xs text-primary underline hover:no-underline"
                      >
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
