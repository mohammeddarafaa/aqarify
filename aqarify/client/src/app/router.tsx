import { createBrowserRouter, Navigate, RouterProvider, Outlet, useLocation, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { useIsMarketingSite } from "@/hooks/use-tenant-slug";
import { useAuthStore } from "@/stores/auth.store";
import { roleHomePath } from "@/lib/rbac";
import { RouteErrorBoundary } from "@/components/shared/route-error-boundary";
import { appendTenantForSlug, appendTenantSearch, resolveTenantSlugForLinks } from "@/lib/tenant-path";
import { RouteTransitionOutlet } from "@/components/shared/route-transition-outlet";

function tenantPreserveTarget(pathname: string, search: string, target: string): string {
  const slug = resolveTenantSlugForLinks(pathname, search);
  return slug ? appendTenantForSlug(slug, pathname, search, target) : target;
}

function RedirectWithTenant({ to }: { to: string }) {
  const { pathname, search } = useLocation();
  return <Navigate to={tenantPreserveTarget(pathname, search, to)} replace />;
}

// ── Marketing site (apex) ──────────────────────────────────────
const MarketingLayout = lazy(() => import("@/app/layouts/marketing-layout"));
const MarketingLandingPage = lazy(() => import("@/features/marketing/pages/marketing-landing-page"));
const SignupPage = lazy(() => import("@/features/marketing/pages/signup-page"));
const PostCheckoutPage = lazy(() => import("@/features/marketing/pages/post-checkout-page"));

// ── Tenant site (subdomain / custom domain / ?tenant= / /t/:slug) ─
const PublicLayout = lazy(() => import("@/app/layouts/public-layout"));
const AuthLayout = lazy(() => import("@/app/layouts/auth-layout"));
const DashboardLayout = lazy(() => import("@/app/layouts/dashboard-layout"));

const LandingPage = lazy(() => import("@/features/landing/pages/landing-page"));
const BrowseProjectsPage = lazy(() => import("@/features/browse/pages/browse-projects-page"));
const BrowseUnitsPage = lazy(() => import("@/features/browse/pages/browse-units-page"));
const CompareUnitsPage = lazy(() => import("@/features/browse/pages/compare-units-page"));
const FavoritesPage = lazy(() => import("@/features/browse/pages/favorites-page"));
const UnitDetailPage = lazy(() => import("@/features/unit-details/pages/unit-detail-page"));

const LoginPage = lazy(() => import("@/features/auth/pages/login-page"));
const RegisterPage = lazy(() => import("@/features/auth/pages/register-page"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/reset-password-page"));

const CustomerDashboardPage = lazy(() => import("@/features/customer-dashboard/pages/overview-page"));
const ReservationsPage = lazy(() => import("@/features/customer-dashboard/pages/reservations-page"));
const PaymentsPage = lazy(() => import("@/features/customer-dashboard/pages/payments-page"));
const DocumentsPage = lazy(() => import("@/features/customer-dashboard/pages/documents-page"));
const WaitlistPage = lazy(() => import("@/features/customer-dashboard/pages/waitlist-page"));
const CheckoutPage = lazy(() => import("@/features/reservation/pages/checkout-page"));
const ReservationSuccessPage = lazy(() => import("@/features/reservation/pages/reservation-success-page"));
const PaymentFailurePage = lazy(() => import("@/features/reservation/pages/payment-failure-page"));

const AgentReservationsPage = lazy(() => import("@/features/agent-dashboard/pages/agent-reservations-page"));
const AgentLeadsPage = lazy(() => import("@/features/agent-dashboard/pages/agent-leads-page"));
const AgentFollowUpsPage = lazy(() => import("@/features/agent-dashboard/pages/agent-follow-ups-page"));
const AgentOverviewPage = lazy(() => import("@/features/agent-dashboard/pages/overview-page"));
const AgentDocumentsPage = lazy(() => import("@/features/agent-dashboard/pages/agent-documents-page"));

const ManagerDashboardPage = lazy(() => import("@/features/manager-dashboard/pages/overview-page"));
const ManagerUnitsPage = lazy(() => import("@/features/manager-dashboard/pages/manager-units-page"));
const ManagerProjectsPage = lazy(() => import("@/features/manager-dashboard/pages/manager-projects-page"));
const ManagerWaitingListPage = lazy(() => import("@/features/manager-dashboard/pages/manager-waiting-list-page"));
const ManagerAgentsPage = lazy(() => import("@/features/manager-dashboard/pages/manager-agents-page"));
const ManagerReservationsPage = lazy(() => import("@/features/manager-dashboard/pages/manager-reservations-page"));
const ManagerReportsPage = lazy(() => import("@/features/manager-dashboard/pages/manager-reports-page"));

const AdminSettingsPage = lazy(() => import("@/features/admin/pages/admin-settings-page"));
const AdminOverviewPage = lazy(() => import("@/features/admin-dashboard/pages/overview-page"));
const ActivityLogsPage = lazy(() => import("@/features/admin-dashboard/pages/activity-logs-page"));
const PlatformAdminDashboardPage = lazy(() => import("@/features/platform-admin/pages/platform-admin-dashboard-page"));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/notifications-page"));
const DiscoveryPage = lazy(() => import("@/features/discovery/pages/discovery-page"));
const ProfilePage = lazy(() => import("@/features/auth/pages/profile-page"));

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loader />}>{children}</Suspense>
);

const D = (C: React.LazyExoticComponent<() => React.ReactElement>, roles?: string[]) => (
  <S>
    <ProtectedRoute roles={roles as import("@/stores/auth.store").UserRole[]}>
      <C />
    </ProtectedRoute>
  </S>
);

function tenantSlugHint(): string | null {
  if (typeof window === "undefined") return null;
  const fromSearch = new URLSearchParams(window.location.search).get("tenant");
  if (fromSearch) return fromSearch;
  const fromPath = window.location.pathname.match(/^\/t\/([^/]+)/)?.[1];
  if (fromPath) return fromPath;
  const fromRef = (() => {
    try {
      if (!document.referrer) return null;
      const url = new URL(document.referrer);
      return (
        new URLSearchParams(url.search).get("tenant") ??
        url.pathname.match(/^\/t\/([^/]+)/)?.[1] ??
        null
      );
    } catch {
      return null;
    }
  })();
  if (fromRef) return fromRef;
  const fromEnv = import.meta.env.VITE_DEFAULT_TENANT as string | undefined;
  return fromEnv ?? null;
}

const TenantRequiredRedirect = ({ targetPath }: { targetPath: string }) => {
  const hintedTenant = tenantSlugHint();
  if (hintedTenant) {
    const slug = encodeURIComponent(hintedTenant);
    const pathOnly = targetPath.split("?")[0];
    const onApex =
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
    const to = onApex ? `/t/${slug}${pathOnly}` : `${targetPath}?tenant=${slug}`;
    return <Navigate to={to} replace />;
  }
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Tenant context required</h1>
        <p className="text-sm text-muted-foreground">
          Open this route with a tenant slug, for example:{" "}
          <code className="text-xs">?tenant=your-tenant</code> or{" "}
          <code className="text-xs">/t/your-tenant/login</code>
        </p>
        <a href="/discover" className="text-sm underline">
          Browse tenants to sign in
        </a>
      </div>
    </div>
  );
};

const RoleHomeRedirect = () => {
  const role = useAuthStore((s) => s.user?.role);
  const { pathname, search } = useLocation();
  return (
    <Navigate
      to={tenantPreserveTarget(pathname, search, roleHomePath(role))}
      replace
    />
  );
};

function IndexLayout() {
  if (useIsMarketingSite()) {
    return (
      <S>
        <MarketingLayout />
      </S>
    );
  }
  return (
    <S>
      <PublicLayout />
    </S>
  );
}

function IndexPage() {
  if (useIsMarketingSite()) {
    return (
      <S>
        <MarketingLandingPage />
      </S>
    );
  }
  return (
    <S>
      <LandingPage />
    </S>
  );
}

function SignupBranch() {
  if (!useIsMarketingSite()) return <Navigate to="/" replace />;
  return (
    <S>
      <MarketingLayout />
    </S>
  );
}

function authBranch() {
  return function AuthBranch() {
    return (
      <S>
        <AuthLayout />
      </S>
    );
  };
}

const LoginAuthBranch = authBranch();
const RegisterAuthBranch = authBranch();
const ForgotPasswordAuthBranch = authBranch();
const ResetPasswordAuthBranch = authBranch();

function TenantPublicBranch() {
  if (useIsMarketingSite()) return <Navigate to="/" replace />;
  return (
    <S>
      <PublicLayout />
    </S>
  );
}

function DashboardGate() {
  if (useIsMarketingSite()) return <TenantRequiredRedirect targetPath="/dashboard" />;
  return (
    <S>
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    </S>
  );
}

/** Marketing-only: deep links under /dashboard/* should explain tenant context. */
function DashboardWildcardGate() {
  if (useIsMarketingSite()) return <TenantRequiredRedirect targetPath="/dashboard" />;
  const { pathname, search } = useLocation();
  return <Navigate to={tenantPreserveTarget(pathname, search, "/dashboard")} replace />;
}

function UnauthorizedPage() {
  const { pathname, search } = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
        <Link
          to={appendTenantSearch(pathname, search, "/")}
          className="text-primary hover:underline text-sm"
        >
          الرجوع للرئيسية
        </Link>
      </div>
    </div>
  );
}

function NotFoundPage() {
  const { pathname, search } = useLocation();
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">404</h1>
        <Link to={appendTenantSearch(pathname, search, "/")} className="text-sm underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

const appRoutes = [
  {
    path: "/",
    element: <IndexLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <IndexPage /> }],
  },
  { path: "/pricing", element: <Navigate to="/#pricing" replace /> },
  { path: "/features", element: <Navigate to="/#features" replace /> },
  { path: "/about", element: <Navigate to="/#guardrails" replace /> },
  { path: "/contact", element: <Navigate to="/#contact" replace /> },
  { path: "/faq", element: <Navigate to="/#faq" replace /> },
  {
    path: "/signup",
    element: <SignupBranch />,
    children: [
      { index: true, element: <S><SignupPage /></S> },
      { path: "complete", element: <S><PostCheckoutPage /></S> },
    ],
  },
  {
    path: "/login",
    element: <LoginAuthBranch />,
    children: [{ index: true, element: <S><LoginPage /></S> }],
  },
  {
    path: "/register",
    element: <RegisterAuthBranch />,
    children: [{ index: true, element: <S><RegisterPage /></S> }],
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordAuthBranch />,
    children: [{ index: true, element: <S><ForgotPasswordPage /></S> }],
  },
  {
    path: "/reset-password",
    element: <ResetPasswordAuthBranch />,
    children: [{ index: true, element: <S><ResetPasswordPage /></S> }],
  },
  {
    path: "/t/:tenantSlug",
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "login",
        element: <S><AuthLayout /></S>,
        children: [{ index: true, element: <S><LoginPage /></S> }],
      },
      {
        path: "register",
        element: <S><AuthLayout /></S>,
        children: [{ index: true, element: <S><RegisterPage /></S> }],
      },
      {
        path: "forgot-password",
        element: <S><AuthLayout /></S>,
        children: [{ index: true, element: <S><ForgotPasswordPage /></S> }],
      },
      {
        path: "reset-password",
        element: <S><AuthLayout /></S>,
        children: [{ index: true, element: <S><ResetPasswordPage /></S> }],
      },
      {
        path: "browse",
        element: <S><PublicLayout /></S>,
        children: [
          { index: true, element: <S><BrowseProjectsPage /></S> },
          { path: "projects/:projectId", element: <S><BrowseUnitsPage /></S> },
        ],
      },
      {
        path: "compare",
        element: <S><PublicLayout /></S>,
        children: [{ index: true, element: <S><CompareUnitsPage /></S> }],
      },
      {
        path: "favorites",
        element: <S><PublicLayout /></S>,
        children: [{ index: true, element: <S><FavoritesPage /></S> }],
      },
      {
        path: "discover",
        element: <S><PublicLayout /></S>,
        children: [{ index: true, element: <S><DiscoveryPage /></S> }],
      },
      {
        path: "units/:id",
        element: <S><PublicLayout /></S>,
        children: [{ index: true, element: <S><UnitDetailPage /></S> }],
      },
      {
        path: "checkout/:unitId",
        element: (
          <S>
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          </S>
        ),
        children: [{ index: true, element: <S><CheckoutPage /></S> }],
      },
    ],
  },
  {
    path: "/browse",
    element: <TenantPublicBranch />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <S><BrowseProjectsPage /></S> },
      { path: "projects/:projectId", element: <S><BrowseUnitsPage /></S> },
    ],
  },
  {
    path: "/compare",
    element: <TenantPublicBranch />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <S><CompareUnitsPage /></S> }],
  },
  {
    path: "/favorites",
    element: <TenantPublicBranch />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <S><FavoritesPage /></S> }],
  },
  {
    path: "/discover",
    element: <TenantPublicBranch />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <S><DiscoveryPage /></S> }],
  },
  {
    path: "/units/:id",
    element: <TenantPublicBranch />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <S><UnitDetailPage /></S> }],
  },
  {
    element: <DashboardGate />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/dashboard", element: <RoleHomeRedirect /> },
      { path: "/dashboard/customer", element: <RedirectWithTenant to="/dashboard" /> },
      { path: "/dashboard/agent", element: <RedirectWithTenant to="/agent/overview" /> },
      { path: "/dashboard/manager", element: <RedirectWithTenant to="/manager/overview" /> },
      { path: "/dashboard/admin", element: <RedirectWithTenant to="/admin/overview" /> },
      { path: "/dashboard/home", element: <RedirectWithTenant to="/dashboard" /> },
      { path: "/customer/dashboard", element: D(CustomerDashboardPage, ["customer"]) },
      { path: "/reservations", element: D(ReservationsPage, ["customer"]) },
      { path: "/payments", element: D(PaymentsPage, ["customer"]) },
      { path: "/waitlist", element: D(WaitlistPage, ["customer"]) },
      { path: "/documents", element: D(DocumentsPage, ["customer", "agent", "manager", "admin", "super_admin"]) },
      { path: "/checkout/:unitId", element: D(CheckoutPage) },
      { path: "/reservations/success", element: D(ReservationSuccessPage) },
      { path: "/reservations/failure", element: D(PaymentFailurePage) },
      { path: "/payments/failure", element: <RedirectWithTenant to="/reservations/failure" /> },
      { path: "/notifications", element: D(NotificationsPage) },
      { path: "/profile", element: D(ProfilePage) },
      { path: "/agent/overview", element: D(AgentOverviewPage, ["agent", "manager", "admin", "super_admin"]) },
      { path: "/agent/reservations", element: D(AgentReservationsPage, ["agent", "manager", "admin", "super_admin"]) },
      { path: "/agent/leads", element: D(AgentLeadsPage, ["agent", "manager", "admin", "super_admin"]) },
      { path: "/agent/follow-ups", element: D(AgentFollowUpsPage, ["agent", "manager", "admin", "super_admin"]) },
      { path: "/agent/documents", element: D(AgentDocumentsPage, ["agent", "manager", "admin", "super_admin"]) },
      { path: "/manager/overview", element: D(ManagerDashboardPage, ["manager", "admin", "super_admin"]) },
      { path: "/manager/dashboard", element: <RedirectWithTenant to="/manager/overview" /> },
      { path: "/manager/units", element: D(ManagerUnitsPage, ["manager", "admin", "super_admin"]) },
      { path: "/manager/projects", element: D(ManagerProjectsPage, ["manager", "admin", "super_admin"]) },
      { path: "/manager/agents", element: D(ManagerAgentsPage, ["manager", "admin", "super_admin"]) },
      { path: "/manager/reservations", element: D(ManagerReservationsPage, ["manager", "admin", "super_admin"]) },
      { path: "/manager/reports", element: D(ManagerReportsPage, ["manager", "admin", "super_admin"]) },
      { path: "/manager/waiting-list", element: D(ManagerWaitingListPage, ["manager", "admin", "super_admin"]) },
      { path: "/admin/overview", element: D(AdminOverviewPage, ["admin", "super_admin"]) },
      { path: "/admin/settings", element: D(AdminSettingsPage, ["admin", "super_admin"]) },
      { path: "/admin/activity-logs", element: D(ActivityLogsPage, ["admin", "super_admin"]) },
      { path: "/platform-admin", element: D(PlatformAdminDashboardPage, ["super_admin"]) },
    ],
  },
  { path: "/dashboard/*", element: <DashboardWildcardGate /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
];

const routes = [
  {
    element: (
      <S>
        <RouteTransitionOutlet />
      </S>
    ),
    errorElement: <RouteErrorBoundary />,
    children: appRoutes,
  },
];

const router = createBrowserRouter(routes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
