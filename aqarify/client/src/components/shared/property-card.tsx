import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareWithFriendsModal } from "@/components/shared/share-with-friends-modal";

interface PropertyCardProps {
  title: string;
  price: string;
  imageUrl: string;
  beds: number;
  baths: number;
  area: number;
  /** When set, shows a share control that opens the share modal */
  sharePath?: string;
}

export function PropertyCard({
  title,
  price,
  imageUrl,
  beds,
  baths,
  area,
  sharePath,
}: PropertyCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareUrl =
    sharePath != null && sharePath !== "" ? `${window.location.origin}${sharePath}` : "";
  const shareMessage =
    shareUrl !== ""
      ? `اطلع على مشروع ${title}\n${shareUrl}`
      : "";

  return (
    <>
      <article className="group relative overflow-hidden rounded-[2rem] shadow-[0_24px_70px_-52px_rgb(20_20_20/.8)]">
        <div className="relative min-h-[360px] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute end-4 top-4 flex items-center gap-2">
            {shareUrl ? (
              <Button
                size="icon"
                variant="secondary"
                type="button"
                className="h-12 w-12 rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur hover:bg-white/25"
                aria-label="مشاركة"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShareOpen(true);
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            ) : null}
            <Button
              size="icon"
              variant="secondary"
              type="button"
              className="h-12 w-12 rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur hover:bg-white/25"
              aria-label="مفضلة"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-semibold leading-tight drop-shadow">{title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/82">
                  <span>{beds} beds</span>
                  <span>{baths} baths</span>
                  <span>{area} sqft</span>
                </div>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-2xl font-semibold leading-none">{price}</p>
                <p className="mt-2 text-xs text-white/70">total price</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {shareUrl ? (
        <ShareWithFriendsModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={shareUrl}
          shareMessage={shareMessage}
          title="شارك مع الأصدقاء"
          description="أرسل رابط المشروع لمن يهتم بالاستثمار أو السكن."
        />
      ) : null}
    </>
  );
}
