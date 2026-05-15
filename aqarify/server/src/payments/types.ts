/**
 * Card payment orchestration. Today only Paymob implements card intents; additional PSPs
 * plug in via {@link createTenantCardPaymentIntent} and dedicated webhook routes.
 */
export type TenantCardGatewayKind = "paymob";
