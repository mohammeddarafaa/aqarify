import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserCircle2, Mail, Phone, Shield, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { appendTenantSearch } from "@/lib/tenant-path";

const schema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  phone: z.string().min(10, "رقم هاتف غير صحيح").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

const ROLE_LABEL: Record<string, string> = {
  customer: "عميل",
  agent: "موظف مبيعات",
  manager: "مدير",
  admin: "مسؤول المنصة",
  super_admin: "مسؤول النظام",
};

function initials(name?: string | null) {
  if (!name) return "؟";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { full_name: user?.full_name ?? "", phone: user?.phone ?? "" },
  });

  const save = useMutation({
    mutationFn: async (d: FormData) => {
      const payload: Record<string, string> = { full_name: d.full_name };
      if (d.phone?.trim()) payload.phone = d.phone.trim();
      const res = await api.patch("/auth/profile", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser({ full_name: data.full_name, phone: data.phone });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("تم حفظ البيانات بنجاح");
    },
    onError: () => toast.error("فشل الحفظ، حاول مرة أخرى"),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${user.id}.${ext}`;
      const { data, error } = await supabase.storage
        .from("unit-images") // reuse accessible bucket
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("unit-images").getPublicUrl(data.path);
      await api.patch("/auth/profile", { avatar_url: urlData.publicUrl });
      updateUser({ avatar_url: urlData.publicUrl });
      toast.success("تم تحديث الصورة");
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSession();
    navigate(appendTenantSearch(pathname, search, "/login"));
  };

  return (
    <>
      <Helmet><title>حسابي</title></Helmet>
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">حسابي الشخصي</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة بياناتك الشخصية وإعدادات الحساب</p>
        </div>

        {/* Avatar */}
        <div className="rounded-xl border bg-card p-5 flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-input"
              className="absolute -bottom-1 -end-1 h-6 w-6 rounded-full border-2 border-background bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors"
              title="تغيير الصورة"
            >
              {avatarUploading ? (
                <div className="h-3 w-3 rounded-full border border-white border-t-transparent animate-spin" />
              ) : (
                <UserCircle2 className="h-3 w-3" />
              )}
            </label>
            <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.full_name}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {ROLE_LABEL[user?.role ?? "customer"] ?? user?.role}
            </Badge>
          </div>
        </div>

        {/* Edit form */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">البيانات الشخصية</h2>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input id="full_name" {...register("full_name")} placeholder="أحمد محمد" />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> رقم الهاتف
              </Label>
              <Input id="phone" {...register("phone")} dir="ltr" placeholder="+201xxxxxxxxx" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <Button type="submit" disabled={save.isPending || !isDirty}>
              {save.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </div>

        {/* Read-only info */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">معلومات الحساب</h2>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">البريد الإلكتروني:</span>
            <span className="font-medium" dir="ltr">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">الدور:</span>
            <span className="font-medium">{ROLE_LABEL[user?.role ?? "customer"] ?? user?.role}</span>
          </div>
        </div>

        <Separator />

        {/* Logout */}
        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </Button>
      </div>
    </>
  );
}
