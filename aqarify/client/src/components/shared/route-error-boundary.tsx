import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RouteErrorBoundary() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unknown error";

  const errorId = Math.random().toString(36).slice(2, 8).toUpperCase();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        رمز الخطأ: <span className="font-mono">{errorId}</span>
      </p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>إعادة تحميل</Button>
        <Button variant="outline" asChild>
          <Link to="/">الرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
