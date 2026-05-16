/**
 * TenantDocumentTitle
 *
 * Sets the browser tab title to "<pageTitle> — <appName>" automatically.
 * Wrap inside any Helmet call or use as a standalone component.
 *
 * Usage:
 *   <TenantDocumentTitle title="الوحدات" />
 *   // → <title>الوحدات — Acme Realty</title>
 *
 * Also exports useTenantDocTitle() for programmatic use.
 */

import { Helmet } from "react-helmet-async";
import { useTenantUi } from "@/hooks/use-tenant-ui";

interface Props { title: string }

export function TenantDocumentTitle({ title }: Props) {
  const { appName } = useTenantUi();
  const fullTitle = `${title} — ${appName}`;
  return <Helmet><title>{fullTitle}</title></Helmet>;
}

export function useTenantDocTitle(pageTitle: string): string {
  const { appName } = useTenantUi();
  return `${pageTitle} — ${appName}`;
}
