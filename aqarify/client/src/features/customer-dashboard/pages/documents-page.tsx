import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["customer-documents"],
    queryFn: async () => (await api.get("/documents")).data.data,
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("اختر ملفا للرفع");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      if (reservationId.trim()) fd.append("reservation_id", reservationId.trim());
      await api.post("/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      setFile(null);
      setReservationId("");
      qc.invalidateQueries({ queryKey: ["customer-documents"] });
      toast.success("تم رفع المستند بنجاح");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "فشل رفع المستند"),
  });

  return (
    <>
      <Helmet><title>مستنداتي</title></Helmet>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">مستنداتي</h1>
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
              <Label>رقم الحجز (اختياري)</Label>
              <Input value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="reservation uuid" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label>الملف</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Button onClick={() => upload.mutate()} disabled={upload.isPending || !file}>
            {upload.isPending ? "جاري الرفع..." : "رفع المستند"}
          </Button>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>
          ) : docs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">لا توجد مستندات بعد</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الملف</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">{TYPE_LABEL[d.type] ?? d.type}</td>
                    <td className="px-4 py-3"><Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "outline"}>{d.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3"><a href={d.file_url} target="_blank" rel="noreferrer" className="text-primary underline">عرض</a></td>
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
