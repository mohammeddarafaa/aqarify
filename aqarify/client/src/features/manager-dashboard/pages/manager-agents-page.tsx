import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type TeamUser = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: "agent" | "manager";
};

const schema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.enum(["agent", "manager"]),
});

type FormData = z.infer<typeof schema>;

export default function ManagerAgentsPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery<TeamUser[]>({
    queryKey: ["manager-agents"],
    queryFn: async () => {
      const res = await api.get("/manager/agents");
      return res.data.data;
    },
  });

  const invite = useMutation({
    mutationFn: async (payload: FormData) => {
      await api.post("/manager/agents", payload);
    },
    onSuccess: () => {
      toast.success("تم إرسال الدعوة");
      reset();
      qc.invalidateQueries({ queryKey: ["manager-agents"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "فشل إرسال الدعوة"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "agent" },
  });

  return (
    <>
      <Helmet><title>الموظفون</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">الموظفون</h1>
        <form onSubmit={handleSubmit((d) => invite.mutate(d))} className="rounded-xl border bg-card p-4 grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label>الاسم</Label>
            <Input {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" dir="ltr" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>الدور</Label>
            <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" {...register("role")}>
              <option value="agent">موظف مبيعات</option>
              <option value="manager">مدير مبيعات</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={invite.isPending}>
              {invite.isPending ? "جاري الإرسال..." : "دعوة عضو"}
            </Button>
          </div>
        </form>

        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">البريد</th>
                  <th className="px-4 py-3 text-right">الهاتف</th>
                  <th className="px-4 py-3 text-right">الدور</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{u.role === "manager" ? "مدير مبيعات" : "موظف مبيعات"}</Badge>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">لا يوجد موظفون حالياً</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
