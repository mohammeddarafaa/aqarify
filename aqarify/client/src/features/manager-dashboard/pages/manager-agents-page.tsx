import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTableShell } from "@/components/shared/data-table-shell";

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
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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

  const filteredUsers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return users.filter((user) => {
      const roleOk = roleFilter === "all" || user.role === roleFilter;
      const searchOk =
        !query ||
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone ?? "").includes(query);
      return roleOk && searchOk;
    });
  }, [users, searchValue, roleFilter]);

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

        <DataTableShell
          columns={[
            {
              header: "الاسم",
              cell: ({ row }) => (
                <span className="font-medium">{row.original.full_name}</span>
              ),
            },
            {
              header: "البريد",
              cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.email}</span>
              ),
            },
            {
              header: "الهاتف",
              cell: ({ row }) => (
                <span className="text-muted-foreground">
                  {row.original.phone ?? "—"}
                </span>
              ),
            },
            {
              header: "الدور",
              cell: ({ row }) => (
                <Badge variant="outline">
                  {row.original.role === "manager"
                    ? "مدير مبيعات"
                    : "موظف مبيعات"}
                </Badge>
              ),
            },
          ] satisfies ColumnDef<TeamUser>[]}
          data={isLoading ? [] : filteredUsers}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث بالاسم أو البريد أو الهاتف..."
          filters={[
            {
              key: "role",
              label: "الدور",
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { value: "all", label: "كل الأدوار" },
                { value: "agent", label: "موظف مبيعات" },
                { value: "manager", label: "مدير مبيعات" },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
