import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertCircleIcon, RefreshCwIcon, CreditCardIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";

export default function PaymentFailurePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withTenantPath = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();
  const unitId = params.get("unit_id");

  return (
    <>
      <Helmet>
        <title>Payment failed | {appName}</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
          <CardContent className="space-y-6 p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircleIcon className="size-9" />
              </div>
              <h1 className="mt-4 text-2xl font-bold">Payment failed</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The payment did not go through. No funds have been charged to your
                account.
              </p>
            </div>

            <Alert variant="destructive">
              <AlertDescription className="space-y-1 text-xs">
                <p className="font-semibold">Common reasons:</p>
                <ul className="ms-4 list-disc">
                  <li>Insufficient balance</li>
                  <li>Card details incorrect</li>
                  <li>Session expired</li>
                  <li>Bank declined the transaction</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              {unitId ? (
                               <Button
                  onClick={() => navigate(withTenantPath(`/checkout/${unitId}`))}
                  className="w-full gap-2 rounded-full"
                >
                  <RefreshCwIcon className="size-4" /> Try again
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="w-full gap-2 rounded-full"
                onClick={() =>
                  navigate(unitId ? withTenantPath(`/checkout/${unitId}`) : withTenantPath("/browse"))
                }
              >
                <CreditCardIcon className="size-4" /> Try a different method
              </Button>
              <Link
                to={withTenantPath("/browse")}
                className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Back to browsing
              </Link>
            </div>

            {tenant?.contact_phone ? (
              <p className="text-center text-xs text-muted-foreground">
                Need help? Call{" "}
                <a
                  href={`tel:${tenant.contact_phone}`}
                  className="font-medium text-primary underline"
                >
                  {tenant.contact_phone}
                </a>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
