import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2Icon } from "lucide-react";
import { Button, Card, CardContent, Meteors } from "@/components/ui-kit";
import { useReservation } from "../hooks/use-reservation";
import { appendTenantSearch } from "@/lib/tenant-path";

export default function ReservationSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { data: reservation } = useReservation(id!);
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <>
      <Helmet>
        <title>Reservation confirmed</title>
      </Helmet>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
        <Card className="relative w-full max-w-md overflow-hidden rounded-2xl border-border shadow-sm">
          <Meteors number={14} />
          <CardContent className="space-y-6 p-8 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2Icon className="size-9" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Reservation confirmed</h1>
              <p className="text-sm text-muted-foreground">
                Your unit has been reserved. Our sales team will reach out shortly
                to finalise the paperwork.
              </p>
            </div>
            {reservation ? (
              <p className="text-sm text-muted-foreground">
                Reservation ID:{" "}
                <span className="font-mono font-medium text-foreground">
                  {reservation.id.slice(0, 8).toUpperCase()}
                </span>
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                className="flex-1 rounded-full"
                onClick={() => navigate(withTenant("/dashboard"))}
              >
                View reservations
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => navigate(withTenant("/browse"))}
              >
                Browse more
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
