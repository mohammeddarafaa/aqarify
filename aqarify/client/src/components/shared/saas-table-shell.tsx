import type { ReactNode } from "react";
import { Card, CardContent, Skeleton } from "@/components/ui-kit";

interface SaaSTableShellProps {
  isLoading: boolean;
  isEmpty: boolean;
  empty: ReactNode;
  children: ReactNode;
}

export function SaaSTableShell({ isLoading, isEmpty, empty, children }: SaaSTableShellProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isEmpty ? (
          <div className="p-8">{empty}</div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
