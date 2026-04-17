import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Suspense, type ReactNode } from "react";
import { I18nProvider } from "react-aria-components";
import { ConnectivityLayer } from "@/components/shared/connectivity-layer";
import { useSessionRestore } from "@/features/auth/hooks/use-session-restore";
import "@/i18n/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function SessionProvider({ children }: { children: ReactNode }) {
  useSessionRestore();
  return <>{children}</>;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HelmetProvider>
      <I18nProvider locale="ar-AE">
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <ConnectivityLayer>
              <Suspense fallback={null}>{children}</Suspense>
            </ConnectivityLayer>
          </SessionProvider>
        </QueryClientProvider>
      </I18nProvider>
    </HelmetProvider>
  );
}
