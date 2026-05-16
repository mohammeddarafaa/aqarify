import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * T2-J — Route Error Boundary
 *
 * Attach as errorElement to every layout route in router.tsx:
 *   { path: "/", element: <DashboardLayout />, errorElement: <RouteErrorBoundary /> }
 *
 * Shows a human-readable Arabic error page instead of a blank screen or
 * console stack trace.  Includes the request ID (if echoed in the error
 * response) so support teams can trace the full request in log aggregators.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let status: number | undefined;
  let statusText: string | undefined;
  let errorId: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    statusText = error.statusText;
    // Some error responses carry a reqId in the data payload
    errorId = (error.data as { reqId?: string } | null)?.reqId;
  } else if (error instanceof Error) {
    statusText = error.message;
  }

  const isNotFound = status === 404;

  return (
    <div
      dir="rtl"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-20 text-center"
    >
      <div className="grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isNotFound ? "الصفحة غير موجودة" : "حدث خطأ غير متوقع"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {isNotFound
            ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
            : "عذراً، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى."}
        </p>

        {/* Error reference for support */}
        {errorId && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            رمز الخطأ: {errorId}
          </p>
        )}
        {status && !errorId && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {status} {statusText}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate(-1)} variant="outline" size="sm">
          رجوع
        </Button>
        <Button onClick={() => navigate("/")} size="sm" className="gap-2">
          <Home className="size-4" />
          الرئيسية
        </Button>
      </div>
    </div>
  );
}
