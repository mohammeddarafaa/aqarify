import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CalendarClock, ClipboardList, FileText, PhoneCall } from "lucide-react";

const cards = [
  {
    title: "الحجوزات",
    description: "راجع الطلبات الجديدة وحدد الإجراء المناسب لكل حجز.",
    to: "/agent/reservations",
    icon: FileText,
    cta: "فتح الحجوزات",
  },
  {
    title: "العملاء المحتملون",
    description: "تابع مراحل العملاء من أول تواصل وحتى التحويل.",
    to: "/agent/leads",
    icon: PhoneCall,
    cta: "إدارة العملاء المحتملين",
  },
  {
    title: "المتابعات",
    description: "نظم مكالماتك وزياراتك اليومية بدون فقد أي موعد.",
    to: "/agent/follow-ups",
    icon: ClipboardList,
    cta: "عرض المتابعات",
  },
];

export default function AgentOverviewPage() {
  return (
    <>
      <Helmet>
        <title>نظرة عامة الموظف</title>
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نظرة عامة الموظف</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ابدأ يومك من هنا ثم انتقل مباشرة إلى الحجوزات، العملاء المحتملين، أو المتابعات.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ title, description, to, icon: Icon, cta }) => (
            <div key={to} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Link to={to} className="text-sm text-primary hover:underline">
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          نصيحة: ابدأ بـ "المتابعات المتأخرة" يوميا لضمان سرعة التحويل وجودة الخدمة.
        </div>
      </div>
    </>
  );
}
