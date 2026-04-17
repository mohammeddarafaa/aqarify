import { describe, expect, it } from "vitest";
import { validateSlug } from "./signup-validator";

describe("validateSlug", () => {
  it("accepts lowercase alphanumerics with hyphens", () => {
    expect(validateSlug("k-developments")).toEqual({ ok: true });
    expect(validateSlug("acme123")).toEqual({ ok: true });
  });

  it("rejects short slugs", () => {
    expect(validateSlug("ab")).toEqual({ ok: false, reason: "too-short" });
  });

  it("rejects uppercase and special characters", () => {
    expect(validateSlug("Palencia")).toEqual({ ok: false, reason: "invalid-chars" });
    expect(validateSlug("a b c")).toEqual({ ok: false, reason: "invalid-chars" });
    expect(validateSlug("acme_co")).toEqual({ ok: false, reason: "invalid-chars" });
  });

  it("rejects leading/trailing hyphens", () => {
    expect(validateSlug("-acme")).toEqual({ ok: false, reason: "leading-hyphen" });
    expect(validateSlug("acme-")).toEqual({ ok: false, reason: "leading-hyphen" });
  });
});
