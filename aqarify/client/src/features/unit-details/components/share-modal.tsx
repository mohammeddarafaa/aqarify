import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle, Share2, Link2 } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";

interface Props {
  open: boolean;
  onClose: () => void;
  unitNumber: string;
  unitId: string;
  price?: number;
}

export function ShareModal({ open, onClose, unitNumber, unitId, price }: Props) {
  const [copied, setCopied] = useState(false);
  const { pathname, search } = useLocation();
  const path = appendTenantSearch(pathname, search, `/units/${unitId}`);
  const url = `${window.location.origin}${path}`;
  const text = `اطلع على وحدة ${unitNumber}${price ? ` بسعر ${price.toLocaleString("ar-EG")} ج.م` : ""} — ${url}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = url; document.body.appendChild(el);
      el.select(); document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: `وحدة ${unitNumber}`, text, url });
    }
  };

  const actions = [
    { icon: MessageCircle, label: "واتساب", color: "#25D366", bg: "#F0FDF4", onClick: shareWhatsApp },
    { icon: Share2, label: "فيسبوك", color: "#1877F2", bg: "#EFF6FF", onClick: shareFacebook },
    ...(("share" in navigator) ? [{ icon: Link2, label: "مشاركة", color: "var(--color-foreground)", bg: "var(--color-muted)", onClick: nativeShare }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm" style={{ borderRadius: 0, border: "1px solid var(--color-border)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.03em" }}>
            مشاركة وحدة {unitNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social buttons */}
          <div className="grid grid-cols-3 gap-3">
            {actions.map(({ icon: Icon, label, color, bg, onClick }) => (
              <button key={label} onClick={onClick}
                className="flex flex-col items-center gap-2 p-3 border hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--color-border)", background: bg, borderRadius: 0 }}>
                <Icon className="h-5 w-5" style={{ color }} />
                <span className="text-xs" style={{ color: "var(--color-foreground)" }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex gap-2">
            <div
              className="flex-1 text-xs px-3 py-2 border truncate"
              dir="ltr"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", background: "var(--color-muted)" }}
            >
              {url}
            </div>
            <Button onClick={copyLink} size="sm" className="gap-1 shrink-0"
              style={{ backgroundColor: "var(--color-foreground)", color: "white", borderRadius: 0 }}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "تم" : "نسخ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
