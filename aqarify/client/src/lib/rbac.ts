import type { UserRole } from "@/stores/auth.store";

export function roleHomePath(role?: UserRole | null): string {
  switch (role) {
    case "customer":
      return "/customer/dashboard";
    case "agent":
      return "/agent/overview";
    case "manager":
      return "/manager/overview";
    case "admin":
    case "super_admin":
      return "/admin/overview";
    default:
      return "/customer/dashboard";
  }
}

/** Staff roles are everyone who logs into the tenant operations side. */
export const STAFF_ROLES = ["agent", "manager", "admin", "super_admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role?: UserRole | null): role is StaffRole {
  if (!role) return false;
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/** Arabic-first labels shown in menus, greetings, and role badges. */
const ROLE_LABELS: Record<UserRole, string> = {
  customer: "عميل",
  agent: "موظف مبيعات",
  manager: "مدير مبيعات",
  admin: "مسؤول المنصة",
  super_admin: "مشرف عام",
};

export function roleLabel(role?: UserRole | null): string {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}
