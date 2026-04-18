import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appendTenantSearch } from "@/lib/tenant-path";

export interface ErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Replace the default Arabic fallback UI */
  fallback?: (props: ErrorBoundaryFallbackProps) => ReactNode;
  /** Optional logging (e.g. Sentry) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches uncaught errors in the React tree below this boundary (render, constructors,
 * and lifecycle methods). Does not catch event handlers, async work, or errors inside
 * React Router’s `errorElement` — use {@link RouteErrorBoundary} for route loaders/actions.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return <DefaultErrorFallback error={error} onRetry={this.reset} />;
  }
}

function DefaultErrorFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const homeHref = appendTenantSearch(pathname, search, "/");
  const errorId = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.error("Component Error:", error, "Error ID:", errorId);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="max-w-md text-sm text-muted-foreground">
         نعتذر، واجهنا مشكلة غير متوقعة. فريقنا أُبلغ بالخطأ وسيقوم بمعالجته.
      </p>
      <p className="text-xs text-muted-foreground">
        رمز الخطأ: <span className="font-mono">{errorId}</span>
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={onRetry}>
          إعادة المحاولة
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          إعادة تحميل الصفحة
        </Button>
        <Button variant="outline" asChild>
          <a href={homeHref}>الرئيسية</a>
        </Button>
      </div>
    </div>
  );
}
