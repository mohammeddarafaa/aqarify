import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { Clock } from "lucide-react";
import { DataTableShell } from "@/components/shared/data-table-shell";

type WaitingListEntry = {
  id: string;
  position: number;
  preferred_type?: string;
  max_budget?: number;
  notes?: string;
  created_at: string;
  users?: { full_name: string; email: string; phone: string };
};

export default function ManagerWaitingListPage() {
  const { data = [], isLoading } = useQuery<WaitingListEntry[]>({
    queryKey: ["manager-waiting-list"],
    queryFn: async () => {
      const r = await api.get("/manager/waiting-list");
      return r.data.data;
    },
  });

  return (
    <>
      <Helmet><title>قائمة الانتظار</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <Clock className="h-6 w-6" />
          قائمة الانتظار ({data.length})
        </h1>
        <DataTableShell
          columns={[
            {
              accessorKey: "position",
              header: "الترتيب",
              cell: ({ row }) => `#${row.original.position}`,
              meta: {
                csvValue: (row: WaitingListEntry) => String(row.position),
              },
            },
            {
              id: "client_name",
              accessorFn: (row) => row.users?.full_name ?? "—",
              header: "العميل",
              cell: ({ row }) => row.original.users?.full_name ?? "—",
            },
            {
              id: "contact",
              accessorFn: (row) =>
                `${row.users?.phone ?? "—"} | ${row.users?.email ?? "—"}`,
              header: "التواصل",
              cell: ({ row }) =>
                `${row.original.users?.phone ?? "—"} | ${row.original.users?.email ?? "—"}`,
            },
            {
              id: "prefs",
              accessorFn: (row) =>
                `${row.preferred_type ? `نوع: ${row.preferred_type}` : "نوع: —"}${
                  row.max_budget
                    ? ` | ميزانية: ${row.max_budget.toLocaleString("ar-EG")} ج.م`
                    : ""
                }`,
              header: "النوع/الميزانية",
              cell: ({ row }) =>
                `${row.original.preferred_type ? `نوع: ${row.original.preferred_type}` : "نوع: —"}${
                  row.original.max_budget
                    ? ` | ميزانية: ${row.original.max_budget.toLocaleString("ar-EG")} ج.م`
                    : ""
                }`,
            },
            {
              accessorKey: "created_at",
              header: "التاريخ",
              cell: ({ row }) =>
                new Date(row.original.created_at).toLocaleDateString("ar-EG"),
              meta: {
                csvValue: (row: WaitingListEntry) =>
                  new Date(row.created_at).toLocaleDateString("ar-EG"),
              },
            },
            {
              accessorKey: "notes",
              header: "ملاحظات",
              cell: ({ row }) => row.original.notes ?? "—",
            },
          ] satisfies ColumnDef<WaitingListEntry>[]}
          data={isLoading ? [] : data}
          searchPlaceholder="بحث..."
          exportFileName="waiting-list"
        />
      </div>
    </>
  );
}
