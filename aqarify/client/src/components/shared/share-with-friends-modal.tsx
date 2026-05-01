import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/app-toast";

export interface ShareWithFriendsModalProps {
  open: boolean;
  onClose: () => void;
  /** Full URL to share (page link) */
  url: string;
  /** Optional line used in social text bodies (includes url if you want) */
  shareMessage: string;
  title?: string;
  description?: string;
}

function openShare(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export function ShareWithFriendsModal({
  open,
  onClose,
  url,
  shareMessage,
  title = "شارك مع الأصدقاء",
  description = "إرسال الرابط يساعد من تبحث عنهم على معرفة هذه الفرصة بسهولة.",
}: ShareWithFriendsModalProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareMessage);

  const social = [
    {
      id: "facebook",
      label: "فيسبوك",
      className: "bg-[#1877F2] text-white hover:opacity-90",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      content: <span className="text-[15px] font-bold leading-none">f</span>,
    },
    {
      id: "x",
      label: "إكس",
      className: "bg-foreground text-background hover:opacity-90",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      content: <span className="text-[14px] font-bold leading-none">𝕏</span>,
    },
    {
      id: "whatsapp",
      label: "واتساب",
      className: "bg-[#25D366] text-white hover:opacity-90",
      href: `https://wa.me/?text=${encodedText}`,
      content: (
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      id: "telegram",
      label: "تيليجرام",
      className: "bg-[#26A5E4] text-white hover:opacity-90",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      content: (
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      id: "linkedin",
      label: "لينكدإن",
      className: "bg-[#0A66C2] text-white hover:opacity-90",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      content: <span className="text-[11px] font-bold leading-none tracking-tight">in</span>,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          // Do not use position:relative here — DialogContent base is fixed; relative wins in tailwind-merge and breaks centering.
          "flex max-h-[min(92dvh,44rem)] w-[min(28rem,calc(100vw-1rem))] flex-col gap-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.75rem] border-0 bg-card p-0 shadow-xl outline-none ring-1 ring-black/6 dark:ring-white/10",
          "max-w-none pt-11 sm:pt-12 pb-6 sm:pb-8",
        )}
      >
        {/* Icon + headings */}
        <div className="shrink-0 px-5 text-center sm:px-6">
          <div className="flex justify-center pb-5">
            <div className="flex size-[3.5rem] items-center justify-center rounded-full border border-border/80 bg-muted shadow-md ring-4 ring-card sm:size-[3.625rem]">
              <div className="flex size-[2.8125rem] items-center justify-center rounded-full bg-muted-foreground/10 sm:size-[2.875rem]">
                <Link2 className="size-[1.25rem] text-muted-foreground sm:size-[1.35rem]" strokeWidth={2} />
              </div>
            </div>
          </div>
          <DialogTitle className="font-heading px-4 text-[1.0625rem] leading-snug font-bold tracking-tight text-foreground sm:px-6 sm:text-lg">
            {title}
          </DialogTitle>
          <p className="mx-auto mt-2.5 max-w-[34ch] text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:text-sm">
            {description}
          </p>
        </div>

        <div className="mt-8 flex shrink-0 flex-col gap-8 px-5 pb-px sm:mt-9 sm:gap-9 sm:px-6">
          <div className="min-w-0 space-y-2.5">
            <p className="text-start text-xs font-semibold text-foreground">شارك رابطك</p>
            <div
              className={cn(
                "flex min-w-0 items-stretch gap-1 rounded-2xl bg-muted/90 p-1.5 ring-1 ring-border/45",
                "flex-row rtl:flex-row-reverse",
              )}
            >
              <div
                className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted/40 px-2 py-2 [scrollbar-width:thin]"
                dir="ltr"
              >
                <p className="w-max min-w-full whitespace-nowrap font-mono text-[11px] leading-relaxed text-muted-foreground tabular-nums sm:text-xs">
                  {url}
                </p>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="grid size-9 shrink-0 place-items-center self-center rounded-xl text-muted-foreground transition-colors hover:bg-background hover:text-foreground active:scale-95 sm:size-10"
                aria-label={copied ? "تم النسخ" : "نسخ الرابط"}
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>

          <div className="min-w-0 space-y-3.5 pb-3 sm:pb-0">
            <p className="text-start text-xs font-semibold text-foreground">شارك عبر</p>
            <ul role="list" className="flex flex-row flex-wrap items-start justify-center gap-x-5 gap-y-5 sm:gap-x-8">
              {social.map((s) => (
                <li key={s.id} className="flex w-[4.85rem] shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openShare(s.href)}
                    className={cn(
                      "grid size-11 place-items-center rounded-full shadow-sm transition-transform active:scale-95 sm:size-12",
                      s.className,
                    )}
                    aria-label={s.label}
                  >
                    {s.content}
                  </button>
                  <span className="block max-w-[4.85rem] text-center text-[10px] leading-tight text-muted-foreground">
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
