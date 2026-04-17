import { describe, expect, it } from "vitest";
import { roleHomePath } from "@/lib/rbac";

describe("roleHomePath", () => {
  it("routes customers to their dashboard", () => {
    expect(roleHomePath("customer")).toBe("/customer/dashboard");
  });

  it("routes agents to their overview", () => {
    expect(roleHomePath("agent")).toBe("/agent/overview");
  });

  it("routes managers to their overview", () => {
    expect(roleHomePath("manager")).toBe("/manager/overview");
  });

  it("routes admins and super_admins to platform overview", () => {
    expect(roleHomePath("admin")).toBe("/admin/overview");
    expect(roleHomePath("super_admin")).toBe("/admin/overview");
  });

  it("falls back to customer dashboard when role is unknown", () => {
    expect(roleHomePath(null)).toBe("/customer/dashboard");
    expect(roleHomePath(undefined)).toBe("/customer/dashboard");
  });
});
