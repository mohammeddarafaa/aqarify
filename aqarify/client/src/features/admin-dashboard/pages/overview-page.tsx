import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { ReceiptText, Settings, ShieldCheck, Users } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">نظرة عامة المنصة</h1>
          <p className="text-sm text-muted-foreground">لوحة تحكم سريعة لإدارة الإعدادات والمستخدمين والنشاط.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Platform Users" value={248} subtitle="All roles" progress={64} progressColor="lime" />
          <KpiCard title="Active Projects" value={37} subtitle="Published" progress={71} />
          <KpiCard title="Open Tickets" value={9} subtitle="Needs action" progress={35} progressColor="striped" />
          <KpiCard title="System Health" value="99.9%" subtitle="Uptime" progress={92} progressColor="lime" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="rounded-2xl border-border shadow-none transition-colors hover:border-lime/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-lime-foreground" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{description}</p>
                <Link to={withTenant("/admin/settings")} className="text-sm font-medium text-foreground hover:underline">
                  فتح لوحة الإدارة
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert>
          <ShieldCheck className="size-4 text-primary" />
          <AlertDescription>
            أفضل ممارسة: راجع الأدوار بشكل دوري للحفاظ على أمان البيانات وسلاسة التشغيل.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}
