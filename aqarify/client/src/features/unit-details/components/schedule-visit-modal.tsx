import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CheckCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  date: z.string().min(1, "اختر التاريخ"),
  time: z.string().min(1, "اختر الوقت"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const TIMES = ["09:00 ص", "10:00 ص", "11:00 ص", "12:00 م", "01:00 م", "02:00 م", "03:00 م", "04:00 م"];

interface Props {
  open: boolean;
  onClose: () => void;
  unitNumber: string;
}

export function ScheduleVisitModal({ open, onClose, unitNumber }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedTime = watch("time");

  const onSubmit = async (_data: FormData) => {
    // In production: call API to create follow_up
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) { onClose(); setSubmitted(false); } }}>
      <DialogContent className="max-w-md" style={{ borderRadius: 0, border: "1px solid var(--color-border)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.03em" }}>
            جدولة زيارة — وحدة {unitNumber}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="font-semibold text-lg" style={{ color: "var(--color-foreground)" }}>تم تسجيل طلب الزيارة!</h3>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              سيتواصل معك أحد مستشارينا قريباً لتأكيد موعد الزيارة.
            </p>
            <Button onClick={() => { onClose(); setSubmitted(false); }}
              style={{ backgroundColor: "var(--color-foreground)", color: "white", borderRadius: 0 }}>
              حسناً
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>الاسم الكامل</Label>
              <Input {...register("name")} placeholder="محمد أحمد" style={{ borderRadius: 0 }} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>رقم الهاتف</Label>
              <Input {...register("phone")} placeholder="01xxxxxxxxx" dir="ltr" style={{ borderRadius: 0 }} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                <Calendar className="h-3 w-3" /> التاريخ
              </Label>
              <Input type="date" {...register("date")} min={minDateStr} style={{ borderRadius: 0 }} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                <Clock className="h-3 w-3" /> الوقت
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {TIMES.map((t) => (
                  <button type="button" key={t}
                    onClick={() => setValue("time", t)}
                    className="text-xs py-2 border transition-colors"
                    style={{
                      borderRadius: 0,
                      borderColor: selectedTime === t ? "var(--color-foreground)" : "var(--color-border)",
                      backgroundColor: selectedTime === t ? "var(--color-foreground)" : "transparent",
                      color: selectedTime === t ? "white" : "var(--color-foreground)",
                    }}
                  >{t}</button>
                ))}
              </div>
              {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full"
              style={{ backgroundColor: "var(--color-foreground)", color: "white", borderRadius: 0 }}>
              {isSubmitting ? "جاري الإرسال..." : "تأكيد طلب الزيارة"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
