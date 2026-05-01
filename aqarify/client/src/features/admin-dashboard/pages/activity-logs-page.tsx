import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { useMemo, useState } from "react";
import { DataTableShell } from "@/components/shared/data-table-shell";

type LogItem = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  users?: { full_name?: string; email?: string; role?: string };
};

export default function ActivityLogsPage() {
  const [searchValue, setSearchValue] = useState("");
  const { data = [], isLoading } = useQuery<LogItem[]>({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => (await api.get("/activity-logs?limit=100")).data.data,
  });
  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => {
      return (
        (item.users?.full_name ?? "").toLowerCase().includes(q) ||
        (item.users?.email ?? "").toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.entity_type.toLowerCase().includes(q)
      );
    });
  }, [data, searchValue]);

  return (
    <>
      <Helmet><title>سجل النشاط</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">سجل النشاط</h1>
        <DataTableShell
          columns={[
            {
              header: "المستخدم",
              cell: ({ row }) =>
                row.original.users?.full_name ?? row.original.users?.email ?? "—",
            },
            { header: "الإجراء", cell: ({ row }) => row.original.action },
            { header: "الكيان", cell: ({ row }) => row.original.entity_type },
            {
              header: "التاريخ",
              cell: ({ row }) =>
                new Date(row.original.created_at).toLocaleString("ar-EG"),
            },
          ] satisfies ColumnDef<LogItem>[]}
          data={isLoading ? [] : filtered}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث بالمستخدم أو الإجراء أو الكيان..."
        />
      </div>
    </>
  );
}
