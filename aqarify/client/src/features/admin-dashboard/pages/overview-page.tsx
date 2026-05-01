import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { ReceiptText, Settings, ShieldCheck, Users } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from "@/components/ui-kit";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";

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
      <SaaSPageShell
        title="نظرة عامة المنصة"
        description="مركز التحكم الإداري لتوحيد الإعدادات، المستخدمين، والاشتراك في مكان واحد."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{description}</p>
                <Link to={withTenant("/admin/settings")} className="text-sm text-primary hover:underline">
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
      </SaaSPageShell>
    </>
  );
}
