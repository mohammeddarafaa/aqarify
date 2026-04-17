import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTenantSlugLive } from "@/lib/host";

function setHostname(hostname: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, hostname, pathname: "/", search: "" },
  });
}

describe("resolveTenantSlugLive", () => {
  beforeEach(() => {
    setHostname("localhost");
    vi.stubEnv("VITE_FORCE_TENANT", "");
    vi.stubEnv("VITE_DEFAULT_TENANT", "");
  });

  it("returns null on the marketing apex", () => {
    setHostname("aqarify.com");
    expect(resolveTenantSlugLive("/", "")).toBeNull();
  });

  it("treats localhost as marketing unless overridden", () => {
    setHostname("localhost");
    expect(resolveTenantSlugLive("/", "")).toBeNull();
  });

  it("extracts slug from ?tenant= query", () => {
    setHostname("localhost");
    expect(resolveTenantSlugLive("/browse", "?tenant=kdevelopments")).toBe(
      "kdevelopments"
    );
  });

  it("extracts slug from /t/:slug path segment", () => {
    setHostname("localhost");
    expect(resolveTenantSlugLive("/t/palencia/browse", "")).toBe("palencia");
  });

  it("reads first DNS subdomain as slug on non-marketing host", () => {
    setHostname("acme.aqarify.com");
    expect(resolveTenantSlugLive("/", "")).toBe("acme");
  });

  it("ignores www. subdomain", () => {
    setHostname("www.aqarify.com");
    expect(resolveTenantSlugLive("/", "")).toBeNull();
  });

  it("honors VITE_FORCE_TENANT + VITE_DEFAULT_TENANT for local dev", () => {
    vi.stubEnv("VITE_FORCE_TENANT", "1");
    vi.stubEnv("VITE_DEFAULT_TENANT", "kdevelopments");
    setHostname("localhost");
    expect(resolveTenantSlugLive("/", "")).toBe("kdevelopments");
  });

  it("gives query param priority over subdomain", () => {
    setHostname("palencia.aqarify.com");
    expect(resolveTenantSlugLive("/", "?tenant=other-tenant")).toBe(
      "other-tenant"
    );
  });
});
