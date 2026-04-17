import { useEffect, useRef, type ReactNode } from "react";
import { WifiOffIcon } from "lucide-react";
import { toast, AppToaster } from "@/lib/app-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";

function useConnectivityToasts(isOnline: boolean) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      if (!isOnline) {
        toast.error("You're offline. Changes may not sync until you're back online.", {
          id: "aqarify-offline",
          duration: 8000,
        });
      }
      return;
    }

    if (!isOnline) {
      toast.error("Connection lost.", { id: "aqarify-offline", duration: 8000 });
    } else {
      toast.dismiss("aqarify-offline");
      toast.success("Back online");
    }
  }, [isOnline]);
}

function OfflineBar({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 right-0 left-0 z-[100002] flex items-center justify-center gap-2 border-b border-amber-500/40 bg-amber-500/95 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-sm dark:bg-amber-600/95 dark:text-amber-50"
    >
      <WifiOffIcon className="size-4 shrink-0" aria-hidden />
      No internet connection
    </div>
  );
}

export function ConnectivityLayer({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  useConnectivityToasts(isOnline);

  return (
    <>
      <OfflineBar visible={!isOnline} />
      {children}
      <AppToaster topOffset={isOnline ? 24 : 56} />
    </>
  );
}
