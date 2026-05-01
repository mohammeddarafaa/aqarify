import { useLocation } from "react-router-dom";
import { appendTenantSearch } from "@/lib/tenant-path";
import { ShareWithFriendsModal } from "@/components/shared/share-with-friends-modal";

interface Props {
  open: boolean;
  onClose: () => void;
  unitNumber: string;
  unitId: string;
  price?: number;
}

export function ShareModal({ open, onClose, unitNumber, unitId, price }: Props) {
  const { pathname, search } = useLocation();
  const path = appendTenantSearch(pathname, search, `/units/${unitId}`);
  const url = `${window.location.origin}${path}`;
  const shareMessage = `اطلع على وحدة ${unitNumber}${price != null ? ` بسعر ${price.toLocaleString("ar-EG")} ج.م` : ""}\n${url}`;

  return (
    <ShareWithFriendsModal
      open={open}
      onClose={onClose}
      url={url}
      shareMessage={shareMessage}
      title="شارك مع الأصدقاء"
      description="شارك الوحدة مع من يبحث عن مسكن يناسبه."
    />
  );
}
