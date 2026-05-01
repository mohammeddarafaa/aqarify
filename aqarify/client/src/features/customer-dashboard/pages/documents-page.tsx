import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { useMyReservations } from "@/features/reservation/hooks/use-reservation";

type Doc = {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  file_url: string;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  national_id: "بطاقة شخصية",
  proof_of_address: "إثبات عنوان",
  bank_receipt: "إيصال بنكي",
  other: "أخرى",
};

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("national_id");
  const [reservationId, setReservationId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: reservations = [] } = useMyReservations();

  useEffect(() => {
    if (reservations.length > 0 && !reservationId) {
      setReservationId(reservations[0].id);
    }
  }, [reservations, reservationId]);

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["customer-documents"],
    queryFn: async () => (await api.get("/documents")).data.data,
  });
  const filteredDocs = docs.filter((doc) => {
    const q = searchValue.trim().toLowerCase();
    const statusOk = statusFilter === "all" || doc.status === statusFilter;
    const searchOk =
      !q || (TYPE_LABEL[doc.type] ?? doc.type).toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("اختر ملفا للرفع");
      const rid = reservationId.trim();
      if (!rid) throw new Error("اختر حجزاً مرتبطاً بالمستند");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      fd.append("reservation_id", rid);
      await api.post("/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      setFile(null);
      qc.invalidateQueries({ queryKey: ["customer-documents"] });
      toast.success("تم رفع المستند بنجاح");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "فشل رفع المستند"),
  });

  const canUpload = reservations.length > 0;

  return (
    <>
      <Helmet><title>مستنداتي</title></Helmet>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">مستنداتي</h1>

        {!canUpload ? (
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            رفع المستندات متاح بعد إنشاء حجز. عندما يكون لديك حجز، اختره أدناه ثم ارفع الملفات المطلوبة.
          </div>
        ) : null}

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>نوع المستند</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border px-3 text-sm">
                <option value="national_id">بطاقة شخصية</option>
                <option value="proof_of_address">إثبات عنوان</option>
                <option value="bank_receipt">إيصال بنكي</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>الحجز المرتبط</Label>
              <select
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                className="h-9 w-full rounded-md border px-3 text-sm"
                disabled={!canUpload}
              >
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.confirmation_number?.trim()
                      ? r.confirmation_number
                      : `#${r.id.slice(0, 8).toUpperCase()}`}{" "}
                    — {r.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>الملف</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={!canUpload} />
            </div>
          </div>
          <Button
            onClick={() => upload.mutate()}
            disabled={upload.isPending || !file || !canUpload || !reservationId.trim()}
          >
            {upload.isPending ? "جاري الرفع..." : "رفع المستند"}
          </Button>
        </div>

        <DataTableShell
          columns={[
            { header: "النوع", cell: ({ row }) => TYPE_LABEL[row.original.type] ?? row.original.type },
            {
              header: "الحالة",
              cell: ({ row }) => (
                <Badge
                  variant={
                    row.original.status === "approved"
                      ? "default"
                      : row.original.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {row.original.status}
                </Badge>
              ),
            },
            {
              header: "التاريخ",
              cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("ar-EG"),
            },
            {
              header: "الملف",
              cell: ({ row }) => (
                <a
                  href={row.original.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  عرض
                </a>
              ),
            },
          ] satisfies ColumnDef<Doc>[]}
          data={isLoading ? [] : filteredDocs}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="ابحث بنوع المستند..."
          filters={[
            {
              key: "status",
              label: "الحالة",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "كل الحالات" },
                { value: "pending", label: "pending" },
                { value: "approved", label: "approved" },
                { value: "rejected", label: "rejected" },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
