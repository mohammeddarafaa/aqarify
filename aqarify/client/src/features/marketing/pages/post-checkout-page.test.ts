import { beforeEach, describe, expect, it } from "vitest";
import { tenantPortalUrl } from "@/features/marketing/pages/post-checkout-page";

function setLocation(overrides: Partial<Location>) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, ...overrides },
  });
}

describe("tenantPortalUrl", () => {
  beforeEach(() => {
    setLocation({ protocol: "http:", host: "localhost:3000", port: "3000" });
  });

  it("falls back to ?tenant= URL on localhost for easy dev testing", () => {
    setLocation({ protocol: "http:", host: "localhost:3000", port: "3000" });
    expect(tenantPortalUrl("kdevelopments")).toBe(
      "http://localhost:3000/?tenant=kdevelopments"
    );
  });

  it("builds subdomain URL on production apex", () => {
    setLocation({ protocol: "https:", host: "aqarify.com", port: "" });
    expect(tenantPortalUrl("acme")).toBe("https://acme.aqarify.com/admin/overview");
  });

  it("preserves custom port in non-standard deployments", () => {
    setLocation({ protocol: "https:", host: "staging.aqarify.com:8443", port: "8443" });
    expect(tenantPortalUrl("acme")).toBe(
      "https://acme.aqarify.com:8443/admin/overview"
    );
  });
});
