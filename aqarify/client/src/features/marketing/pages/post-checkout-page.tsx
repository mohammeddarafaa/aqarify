import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2Icon,
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  LockIcon,
  CreditCardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSubscriptionStatus } from "../hooks/use-subscription-status";

// How long we'll wait on Paymob before surfacing a "stuck" banner.
const STUCK_AFTER_MS = 3 * 60_000;

export function tenantPortalUrl(slug: string): string {
  const { protocol, host, port } = window.location;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return `${protocol}//${host}/?tenant=${slug}`;
  }
  // `host` may include the port (e.g. "staging.aqarify.com:8443"). Strip it
  // before computing the apex so we don't append the port twice.
  const hostname = host.split(":")[0];
  const apex = hostname.split(".").slice(-2).join(".");
  const scheme = protocol || "https:";
  const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${scheme}//${slug}.${apex}${portSuffix}/admin/overview`;
}

export default function PostCheckoutPage() {
  const [params] = useSearchParams();
  const subscriptionId = params.get("subscription_id");
  const iframeUrl = params.get("iframe");
  const isDev = params.get("dev") === "1";
  const { data, error, refetch, isRefetching } = useSubscriptionStatus(subscriptionId);
  const [stuck, setStuck] = useState(false);
  const paymobReturnSyncStarted = useRef(false);

  const startedAt = useMemo(() => Date.now(), []);
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - startedAt > STUCK_AFTER_MS) setStuck(true);
    }, 10_000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    if (data?.status === "active" && data.tenant_slug) {
      const t = setTimeout(() => {
        window.location.href = tenantPortalUrl(data.tenant_slug!);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [data]);

  // Paymob appends signed transaction params to redirection_url. The platform
  // webhook often cannot reach localhost — confirm from the browser using the same HMAC.
  useEffect(() => {
    if (!subscriptionId || isDev) return;
    const sp = new URLSearchParams(window.location.search);
    if (!sp.get("hmac") || sp.get("success") !== "true" || !sp.get("id")) return;
    if (paymobReturnSyncStarted.current) return;
    paymobReturnSyncStarted.current = true;

    const paymob: Record<string, string> = {};
    sp.forEach((v, k) => {
      paymob[k] = v;
    });

    void (async () => {
      try {
        await api.post("/subscription/confirm-platform-return", {
          subscription_id: subscriptionId,
          paymob,
        });
        const next = new URLSearchParams({ subscription_id: subscriptionId });
        if (iframeUrl) next.set("iframe", iframeUrl);
        window.history.replaceState({}, "", `${window.location.pathname}?${next.toString()}`);
      } catch {
        paymobReturnSyncStarted.current = false;
      } finally {
        void refetch();
      }
    })();
  }, [subscriptionId, isDev, iframeUrl, refetch]);

  if (!subscriptionId) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <AlertTriangleIcon className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-semibold">Missing subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find your subscription reference. Please{" "}
          <a href="/signup" className="underline">
            start signup
          </a>{" "}
          again.
        </p>
      </section>
    );
  }

  const isActive = data?.status === "active";
  const isTerminal = data?.status === "cancelled" || data?.status === "expired";
  const showIframe = !isActive && !isTerminal && !!iframeUrl && !isDev;

  return (
    <>
      <Helmet>
        <title>Finishing setup — Aqarify</title>
      </Helmet>

      <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        {isActive ? (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-50 p-10 text-center">
            <CheckCircle2Icon className="mx-auto size-12 text-emerald-600" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Your portal is live.
            </h1>
            <p className="mt-3 text-sm text-emerald-900/80">
              Redirecting to{" "}
              <span className="font-medium">{data?.tenant_slug}.aqarify.com</span>
              ...
            </p>
            <Button asChild className="mt-8">
              <a href={tenantPortalUrl(data?.tenant_slug ?? "")}>Go now</a>
            </Button>
          </div>
        ) : isTerminal ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center">
            <AlertTriangleIcon className="mx-auto size-10 text-red-500" />
            <h1 className="mt-4 text-2xl font-semibold">Payment not completed</h1>
            <p className="mt-2 text-sm text-red-900/80">
              Your subscription is <span className="font-medium">{data?.status}</span>.
              You can restart signup to try again.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <a href="/signup">Restart signup</a>
            </Button>
          </div>
        ) : showIframe ? (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 shadow-lg ring-1 ring-foreground/5">
            <div className="border-b border-border/60 bg-card/90 px-5 py-4 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CreditCardIcon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-foreground">
                      Complete payment
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LockIcon className="size-3 shrink-0 opacity-70" />
                      Hosted by Paymob — card details never touch Aqarify.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex">
                    <Loader2Icon className="size-3.5 animate-spin" />
                    Confirming subscription…
                  </span>
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm hover:bg-muted/50"
                  >
                    <RefreshCwIcon
                      className={
                        "size-3 " + (isRefetching ? "animate-spin" : "")
                      }
                    />
                    Refresh status
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-muted/40 p-2 sm:p-3">
              <iframe
                src={iframeUrl!}
                title="Paymob secure checkout"
                allow="payment *"
                className="h-[min(72vh,720px)] min-h-[520px] w-full rounded-xl border border-border/50 bg-background shadow-inner"
              />
            </div>
            {stuck ? (
              <p className="px-4 py-3 text-xs text-amber-700">
                Still waiting? If Paymob completed, tap{" "}
                <button
                  onClick={() => refetch()}
                  className="underline"
                  type="button"
                >
                  refresh
                </button>{" "}
                or reach support — payments are always reconciled by the webhook.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Loader2Icon className="mx-auto size-8 animate-spin text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">
              Confirming your payment...
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDev
                ? "Dev bypass is active — activating your workspace now."
                : "This usually takes a few seconds. Your portal activates automatically once Paymob confirms."}
            </p>
            {error ? (
              <p className="mt-3 text-xs text-red-600">
                Could not reach the subscription endpoint. Check your connection and retry.
              </p>
            ) : null}
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-6"
              disabled={isRefetching}
            >
              <RefreshCwIcon
                className={
                  "me-1 size-3.5 " + (isRefetching ? "animate-spin" : "")
                }
              />
              Check again
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
