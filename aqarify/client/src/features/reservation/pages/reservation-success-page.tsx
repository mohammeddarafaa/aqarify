import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReservationByConfirmation } from "../hooks/use-reservation";
import { appendTenantSearch } from "@/lib/tenant-path";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
export default function ReservationSuccessPage() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const method = searchParams.get("method");
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { data: reservation, isLoading, isError } = useReservationByConfirmation(ref);
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const showBank =
    (method === "bank_transfer" || reservation?.payment_method === "bank_transfer") &&
    reservation?.status === "pending";

  const bankDetails = reservation?.bank_details;

  if (!ref) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Missing reservation reference. Return to browse and try again.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reservation confirmed</title>
      </Helmet>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
        <Card className="relative w-full max-w-md overflow-hidden rounded-2xl border-border shadow-sm">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100/80 text-emerald-700">
              <CheckCircle2Icon className="size-9" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Reservation confirmed</h1>
              <p className="text-sm text-muted-foreground">
                Your unit has been reserved. Our sales team will reach out shortly
                to finalise the paperwork.
              </p>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading reservation…</p>
            ) : isError || !reservation ? (
              <p className="text-sm text-destructive">Could not load this reservation.</p>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Reservation ID:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {reservation.id.slice(0, 8).toUpperCase()}
                  </span>
                </p>
                {reservation.confirmation_number ? (
                  <p>
                    Payment reference:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {reservation.confirmation_number}
                    </span>
                  </p>
                ) : null}
              </div>
            )}

            {showBank && reservation ? (
              <div className="rounded-xl border bg-muted/40 p-4 text-start text-sm">
                <p className="font-semibold text-foreground">Bank transfer</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Transfer the reservation fee using the reference above. Then upload your receipt under Dashboard → Documents (type: bank receipt).
                </p>
                {bankDetails?.bank_account_number ? (
                  <ul className="mt-3 space-y-1 font-mono text-xs text-foreground">
                    {bankDetails.bank_name ? <li>Bank: {bankDetails.bank_name}</li> : null}
                    {bankDetails.bank_account_holder ? (
                      <li>To: {bankDetails.bank_account_holder}</li>
                    ) : null}
                    <li>Account: {bankDetails.bank_account_number}</li>
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    Bank account details are not published for this workspace. Please contact the sales team with your reference number.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full rounded-full"
                  onClick={() => navigate(withTenant("/documents"))}
                >
                  Upload receipt
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                className="min-w-[140px] flex-1 rounded-full"
                onClick={() => navigate(withTenant("/dashboard"))}
              >
                View reservations
              </Button>
              <Button
                variant="outline"
                className="min-w-[140px] flex-1 rounded-full"
                onClick={() => navigate(withTenant("/browse"))}
              >
                Browse more
              </Button>
              {reservation?.status === "confirmed" && reservation?.id ? (
                <Button
                  variant="outline"
                  className="min-w-[140px] flex-1 rounded-full"
                  onClick={async () => {
                    try {
                      const res = await api.get(`/reservations/${reservation.id}/receipt`);
                      window.open(res.data.data.receipt_url, "_blank");
                    } catch {
                      toast.error("الإيصال غير متاح بعد");
                    }
                  }}
                >
                  تحميل الإيصال
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
