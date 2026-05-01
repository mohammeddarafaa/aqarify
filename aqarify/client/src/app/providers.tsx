import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Suspense, type ReactNode } from "react";
import { ConnectivityLayer } from "@/components/shared/connectivity-layer";
import { useSessionRestore } from "@/features/auth/hooks/use-session-restore";
import { useFavorites } from "@/features/browse/hooks/use-favorites";
import { useLocaleSync } from "@/hooks/use-locale-sync";
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
  useFavorites();
  useLocaleSync();
  return <>{children}</>;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ConnectivityLayer>
            <Suspense fallback={null}>{children}</Suspense>
          </ConnectivityLayer>
        </SessionProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
