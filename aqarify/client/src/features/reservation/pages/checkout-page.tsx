import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "@/lib/app-toast";
import { api } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";
import { CheckoutForm } from "../components/checkout-form";
import { useCreateReservation } from "../hooks/use-reservation";

function readApiErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || !error) return null;
  const maybeResponse = (error as { response?: { data?: { error?: { message?: string } } } }).response;
  return maybeResponse?.data?.error?.message ?? null;
}

export default function CheckoutPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();
  const isReadOnly = tenant?.status === "read_only";
  const { mutate, isPending } = useCreateReservation();

  const { data: unit, isLoading } = useQuery({
    queryKey: ["unit-checkout", unitId],
    queryFn: async () => {
      const res = await api.get(`/units/${unitId}`);
      return res.data.data;
    },
    enabled: !!unitId,
  });

  const handleSubmit = (
    formData: Parameters<typeof mutate>[0] extends { unit_id: string } & infer F
      ? F
      : never,
  ) => {
    mutate(
      { unit_id: unitId!, ...formData },
      {
        onSuccess: (data) => {
          const iframeBase =
            import.meta.env.VITE_PAYMOB_IFRAME_BASE_URL ??
            "https://accept.paymob.com/api/acceptance/iframes";
          if (data.payment_key && data.iframe_id) {
            window.location.href = `${iframeBase.replace(/\/$/, "")}/${data.iframe_id}?payment_token=${data.payment_key}`;
          } else if (data.payment_key && !data.iframe_id) {
            toast.error(
              "Payment gateway not fully configured for this tenant. Contact support.",
            );
          } else if (data.method === "bank_transfer") {
            const ref = data.reservation.confirmation_number ?? data.reservation.id;
            navigate(
              appendTenantSearch(
                pathname,
                search,
                `/reservations/success?ref=${encodeURIComponent(ref)}&method=bank_transfer`,
              ),
            );
          } else {
            const ref = data.reservation.confirmation_number ?? data.reservation.id;
            navigate(
              appendTenantSearch(
                pathname,
                search,
                `/reservations/success?ref=${encodeURIComponent(ref)}`,
              ),
            );
          }
        },
        onError: (err: unknown) => {
          toast.error(readApiErrorMessage(err) ?? "Reservation failed. Please try again.");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="mb-4 h-10 w-32" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="p-8 text-center text-muted-foreground">Unit not found</div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          Reserve unit {unit.unit_number} | {appName}
        </title>
      </Helmet>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeftIcon className="size-4" /> Back
        </Button>

        {isReadOnly ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              This workspace is currently read-only. New reservations are paused
              until the subscription is renewed.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="space-y-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Confirm reservation</h1>
                <p className="text-sm text-muted-foreground">
                  Unit {unit.unit_number} · {unit.type} · {unit.size_sqm} m²
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <ShieldCheckIcon className="size-3" /> Secure · Paymob
              </span>
            </div>
          </CardContent>
          <CardContent className="border-t border-border p-6">
            <CheckoutForm
              unitPrice={unit.price}
              reservationFee={unit.reservation_fee}
              onSubmit={handleSubmit}
              isLoading={isPending || isReadOnly}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
