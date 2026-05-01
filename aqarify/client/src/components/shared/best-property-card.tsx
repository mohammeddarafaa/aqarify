import { ArrowUpRight } from "lucide-react";

interface BestPropertyCardProps {
  title: string;
  totalSales: string;
  totalVisits: string;
  imageUrl: string;
}

export function BestPropertyCard({ title, totalSales, totalVisits, imageUrl }: BestPropertyCardProps) {
  return (
    <article className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-lime p-6 text-lime-foreground shadow-[0_24px_70px_-48px_rgb(20_20_20/.8)]">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">Best Apartments</p>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-foreground/10">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>

      <div className="relative z-10 mt-9 max-w-[13rem]">
        <h3 className="text-3xl font-medium leading-tight">{title}</h3>
      </div>

      <div className="relative z-10 mt-9 grid max-w-[10rem] gap-4 text-sm">
        <div>
          <p className="text-lime-foreground/65">Total Sales</p>
          <p className="mt-1 text-2xl font-semibold leading-none">{totalSales}</p>
        </div>
        <div>
          <p className="text-lime-foreground/65">Total Visits</p>
          <p className="mt-1 text-2xl font-semibold leading-none">{totalVisits}</p>
        </div>
      </div>

      <img
        src={imageUrl}
        alt={title}
        className="absolute bottom-0 right-0 h-[58%] w-[62%] rounded-tl-[2rem] object-cover shadow-2xl"
      />
    </article>
  );
}
