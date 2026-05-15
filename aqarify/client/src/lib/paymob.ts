/** Hosted Paymob iframe URL for card checkout (token from `/payments/:id/pay-intent` or reservation create). */
export function paymobIframeCheckoutUrl(iframeId: string, paymentToken: string): string {
  const base =
    import.meta.env.VITE_PAYMOB_IFRAME_BASE_URL?.replace(/\/$/, "") ??
    "https://accept.paymob.com/api/acceptance/iframes";
  return `${base}/${iframeId}?payment_token=${encodeURIComponent(paymentToken)}`;
}
