import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UsersIcon, ClockIcon, CheckCircleIcon } from "lucide-react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/components/ui-kit";
import { useJoinWaitlist } from "@/features/waiting-list/hooks/use-waiting-list";
import { useAuthStore } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";

interface Props {
  open: boolean;
  onClose: () => void;
  unitId: string;
  unitNumber: string;
}

export function JoinWaitlistModal({
  open,
  onClose,
  unitId,
  unitNumber,
}: Props) {
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated && Boolean(s.accessToken));
  const returnState = {
    from: { pathname, search },
  } as const;

  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [done, setDone] = useState<{ position: number } | null>(null);
  const { mutateAsync, isPending } = useJoinWaitlist();

  const handleJoin = async () => {
    try {
      const result = await mutateAsync({
        unitId,
        sms: smsNotif,
        email: emailNotif,
      });
      setDone({ position: result?.position ?? 1 });
    } catch {
      /* handled in hook */
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) {
          onClose();
          setDone(null);
        }
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Join the waitlist</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-6 text-center">
            <CheckCircleIcon className="mx-auto size-12 text-emerald-500" />
            <div>
              <h3 className="text-lg font-semibold">You're in!</h3>
              <p className="mt-2 text-3xl font-bold text-primary">
                #{done.position}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your position on the waitlist
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              We'll notify you as soon as the unit is available. You'll have 24
              hours to complete the reservation.
            </p>
            <Button
              className="rounded-full"
              onClick={() => {
                onClose();
                setDone(null);
              }}
            >
              Got it
            </Button>
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              The waitlist is tied to your account so we can notify you. Sign in or create a
              customer account, then join from this page.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="h-11 flex-1 rounded-full text-sm font-semibold">
                <Link to={withTenant("/login")} state={returnState}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 flex-1 rounded-full text-sm font-semibold">
                <Link to={withTenant("/register")} state={returnState}>
                  Create account
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2 rounded-xl bg-muted p-4">
              <p className="text-sm font-medium">
                Unit {unitNumber} is currently reserved
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UsersIcon className="size-3.5" />
                <span>Joining is free — no payment required now</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ClockIcon className="size-3.5" />
                <span>Once notified, you have 24h to reserve</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Notification preferences
              </p>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sms"
                  checked={smsNotif}
                  onCheckedChange={(v: boolean | "indeterminate") => setSmsNotif(v === true)}
                />
                <Label htmlFor="sms" className="cursor-pointer">
                  Notify via SMS
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="email"
                  checked={emailNotif}
                  onCheckedChange={(v: boolean | "indeterminate") => setEmailNotif(v === true)}
                />
                <Label htmlFor="email" className="cursor-pointer">
                  Notify via email
                </Label>
              </div>
            </div>

            <Button
              className="h-11 w-full rounded-full text-sm font-semibold"
              disabled={isPending}
              onClick={handleJoin}
            >
              {isPending ? "Joining..." : "Join waitlist"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
