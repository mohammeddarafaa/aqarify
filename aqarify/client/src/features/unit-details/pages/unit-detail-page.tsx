import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  BathIcon,
  Maximize2Icon,
  LayersIcon,
  Share2Icon,
  CalendarIcon,
  DownloadIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui-kit";
import { Navbar } from "@/features/landing/components/navbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PricingSection } from "@/features/unit-details/components/pricing-section";
import { PaymentCalculator } from "@/features/unit-details/components/payment-calculator";
import { ScheduleVisitModal } from "@/features/unit-details/components/schedule-visit-modal";
import { ShareModal } from "@/features/unit-details/components/share-modal";
import { JoinWaitlistModal } from "@/features/waiting-list/components/join-waitlist-modal";
import { useUnitDetail } from "@/features/unit-details/hooks/use-unit-detail";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const { data: unit, isLoading } = useUnitDetail(id!);
  const tenant = useTenantStore((s) => s.tenant);
  const [shareOpen, setShareOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-20">
          <Skeleton className="mb-6 h-72 w-full" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!unit) return null;

  const gallery = unit.gallery?.length
    ? unit.gallery
    : [`https://placehold.co/1200x800/f5f5f5/888888?text=Unit+${unit.unit_number}`];
  const cover = gallery[galleryIdx];
  const isReadOnly = tenant?.status === "read_only";

  return (
    <>
      <Helmet>
        <title>
          Unit {unit.unit_number} | {tenant?.name ?? "المطور"}
        </title>
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={withTenant("/")} className="inline-flex items-center gap-1">
                    <ArrowLeftIcon className="size-3" /> Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={withTenant("/browse")}>Browse</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Unit {unit.unit_number}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Gallery */}
          <div className="relative">
            <div className="relative h-72 overflow-hidden rounded-2xl bg-muted md:h-[440px]">
              <img src={cover} alt={unit.unit_number} className="h-full w-full object-cover" />
              <div className="absolute start-4 top-4">
                <StatusBadge status={unit.status} />
              </div>
              {unit.virtual_tour_url ? (
                <a
                  href={unit.virtual_tour_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 start-4 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white hover:bg-black/80"
                >
                  360° virtual tour
                </a>
              ) : null}
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {gallery.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setGalleryIdx(i)}
                    className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors"
                    style={{
                      borderColor:
                        i === galleryIdx ? "var(--color-foreground)" : "transparent",
                    }}
                  >
                    <img src={img} alt={`gallery-${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Left: details w/ tabs */}
            <div className="space-y-6 lg:col-span-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {unit.type} · Unit {unit.unit_number}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Floor {unit.floor} · {tenant?.address ?? "Egypt"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: BedDoubleIcon, label: "Bedrooms", value: unit.bedrooms },
                  { icon: BathIcon, label: "Bathrooms", value: unit.bathrooms },
                  { icon: Maximize2Icon, label: "Area", value: `${unit.size_sqm} m²` },
                  { icon: LayersIcon, label: "Floor", value: unit.floor },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-card p-4 text-center"
                  >
                    <Icon className="mx-auto mb-1 size-4 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-semibold text-foreground">{value}</div>
                  </div>
                ))}
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="payment">Payment plan</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-2 font-semibold">About this unit</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      A {unit.type.toLowerCase()} on floor {unit.floor} with{" "}
                      {unit.bedrooms} bedrooms, {unit.bathrooms} bathrooms and{" "}
                      {unit.size_sqm}&nbsp;m² of living space
                      {unit.view_type ? ` overlooking the ${unit.view_type.toLowerCase()}` : ""}.
                      Finished {unit.finishing ? `(${unit.finishing.toLowerCase()})` : "to spec"}.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="payment" className="pt-4">
                  <PaymentCalculator unit={unit} />
                </TabsContent>
                <TabsContent value="details" className="pt-4">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {unit.view_type ? (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                        <dt className="text-muted-foreground">View</dt>
                        <dd className="font-medium text-foreground">{unit.view_type}</dd>
                      </div>
                    ) : null}
                    {unit.finishing ? (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                        <dt className="text-muted-foreground">Finishing</dt>
                        <dd className="font-medium text-foreground">{unit.finishing}</dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">Reservation fee</dt>
                      <dd className="font-medium text-foreground">
                        EGP {unit.reservation_fee.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">Installments</dt>
                      <dd className="font-medium text-foreground">
                        {unit.installment_months} months
                      </dd>
                    </div>
                  </dl>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: sticky price rail */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <PricingSection unit={unit} />

              {unit.status === "available" && !isReadOnly ? (
                <Button asChild className="h-12 w-full rounded-full text-sm font-semibold">
                  <Link to={withTenant(`/checkout/${unit.id}`)}>Reserve now</Link>
                </Button>
              ) : unit.status === "available" && isReadOnly ? (
                <Button
                  disabled
                  className="h-12 w-full rounded-full text-sm font-semibold"
                  title="This tenant is in read-only mode"
                >
                  Reservation unavailable
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full text-sm font-semibold"
                  onClick={() => setWaitlistOpen(true)}
                  disabled={isReadOnly}
                >
                  Join the waitlist
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2 rounded-full text-xs"
                  onClick={() => setVisitOpen(true)}
                  disabled={isReadOnly}
                >
                  <CalendarIcon className="size-3.5" /> Schedule visit
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 rounded-full text-xs"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2Icon className="size-3.5" /> Share
                </Button>
              </div>

              {unit.floor_plan_url ? (
                <a
                  href={unit.floor_plan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <DownloadIcon className="size-3.5" /> Download floor plan
                </a>
              ) : null}
            </aside>
          </div>
        </div>
      </main>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        unitNumber={unit.unit_number}
        unitId={unit.id}
        price={unit.price}
      />
      <ScheduleVisitModal
        open={visitOpen}
        onClose={() => setVisitOpen(false)}
        unitNumber={unit.unit_number}
      />
      <JoinWaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        unitId={unit.id}
        unitNumber={unit.unit_number}
        tenantId={tenant?.id ?? ""}
      />
    </>
  );
}
