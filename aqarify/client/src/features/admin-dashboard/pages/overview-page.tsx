import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { ReceiptText, Settings, ShieldCheck, Users } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";

const items = [
  {
    title: "إعدادات المنصة",
    description: "تحديث بيانات الشركة، الهوية البصرية، وقنوات الإشعارات.",
    icon: Settings,
  },
  {
    title: "إدارة المستخدمين",
    description: "مراجعة الأدوار والصلاحيات لضمان تشغيل آمن ومنظم.",
    icon: Users,
  },
  {
    title: "الاشتراك والفواتير",
    description: "متابعة الخطة الحالية، التجديد، وسجل الفواتير.",
    icon: ReceiptText,
  },
];

export default function AdminOverviewPage() {
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <>
      <Helmet>
        <title>نظرة عامة المنصة</title>
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نظرة عامة المنصة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مركز التحكم الإداري لتوحيد إعدادات المنصة، المستخدمين، والاشتراك في مكان واحد.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Link to={withTenant("/admin/settings")} className="text-sm text-primary hover:underline">
                فتح لوحة الإدارة
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          أفضل ممارسة: راجع الأدوار بشكل دوري للحفاظ على أمان البيانات وسلاسة التشغيل.
        </div>
      </div>
    </>
  );
}
