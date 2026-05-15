import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText, Settings, ShieldCheck, Users } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";
import { api } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";

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

type AdminSummary = {
  team_users: number;
  projects: number;
  pending_reservations: number;
};

export default function AdminOverviewPage() {
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const { data: summary, isLoading } = useQuery<AdminSummary>({
    queryKey: ["admin-summary"],
    queryFn: async () => (await api.get("/admin/summary")).data.data,
  });

  const teamUsers = summary?.team_users ?? 0;
  const projects = summary?.projects ?? 0;
  const pending = summary?.pending_reservations ?? 0;

  const teamProgress = teamUsers > 0 ? Math.min(100, 12 + teamUsers * 4) : 0;
  const projectsProgress = projects > 0 ? Math.min(100, 20 + projects * 6) : 0;
  const pendingProgress = pending > 0 ? Math.min(100, 25 + pending * 8) : 0;

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </>
          ) : (
            <>
              <KpiCard
                title="فريق العمل"
                value={String(teamUsers)}
                subtitle="مستخدمون بأدوار تشغيلية"
                progress={teamProgress}
                progressColor="lime"
              />
              <KpiCard
                title="المشاريع"
                value={String(projects)}
                subtitle="مشاريع مسجّلة"
                progress={projectsProgress}
              />
              <KpiCard
                title="حجوزات معلّقة"
                value={String(pending)}
                subtitle="تحتاج متابعة"
                progress={pendingProgress}
                progressColor="striped"
              />
            </>
          )}
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
