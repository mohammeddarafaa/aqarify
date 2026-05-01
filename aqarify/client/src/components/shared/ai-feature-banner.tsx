import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function AiFeatureBanner() {
  return (
    <section className="relative min-h-[252px] overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-6 text-foreground shadow-[0_24px_70px_-52px_rgb(20_20_20/.7)] backdrop-blur">
      <div className="relative z-10 max-w-[27rem]">
        <p className="text-sm font-semibold">New AI Feature</p>
        <h3 className="mt-8 max-w-[19ch] text-2xl font-medium leading-tight sm:text-3xl">
          Leads and Property Search
        </h3>
        <p className="mt-3 max-w-[32ch] text-sm leading-6 text-muted-foreground">
          Optimize your time and increase efficiency with our integrated leads and property search feature.
        </p>
        <Button className="mt-5 h-12 rounded-full bg-foreground px-9 text-background hover:bg-foreground/90">
          Search now
        </Button>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 h-44 w-44 rounded-[2rem] bg-lime sm:h-52 sm:w-52">
        <div className="absolute inset-3 rounded-[1.6rem] bg-[repeating-conic-gradient(from_2deg,var(--lime)_0deg,var(--lime)_4deg,transparent_4deg,transparent_8deg)] opacity-90" />
        <div className="absolute right-5 top-5 grid h-16 w-16 place-items-center rounded-full bg-background text-foreground shadow-lg">
          <Search className="h-6 w-6" />
        </div>
      </div>

      <div className="absolute right-32 top-6 z-10 hidden sm:block">
        <Avatar className="h-10 w-10 border-4 border-card shadow-md">
          <AvatarImage src="" />
          <AvatarFallback className="bg-background text-xs">AK</AvatarFallback>
        </Avatar>
      </div>
      <div className="absolute right-28 top-24 z-10 hidden sm:block">
        <Avatar className="h-16 w-16 border-4 border-card shadow-md">
          <AvatarFallback className="bg-background text-sm">AI</AvatarFallback>
        </Avatar>
      </div>
      <div className="absolute right-5 top-36 z-10 hidden sm:block">
        <Avatar className="h-12 w-12 border-4 border-card shadow-md">
          <AvatarFallback className="bg-background text-xs">JK</AvatarFallback>
        </Avatar>
      </div>
    </section>
  );
}
