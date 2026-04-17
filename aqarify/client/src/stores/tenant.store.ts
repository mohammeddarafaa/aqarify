import { create } from "zustand";

export interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
}

export interface FilterSchema {
  filters: FilterDefinition[];
  has_search: boolean;
  has_map_view: boolean;
  has_clear_button: boolean;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: "dropdown" | "range" | "checkbox";
  options?: string[];
  default?: string;
}

export type TenantStatus =
  | "active"
  | "suspended"
  | "trial"
  | "read_only"
  | "pending_signup";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  theme_config: ThemeConfig;
  filter_schema: FilterSchema;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  status?: TenantStatus;
}

interface TenantState {
  tenant: Tenant | null;
  isLoading: boolean;
  setTenant: (tenant: Tenant) => void;
  setLoading: (loading: boolean) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()((set) => ({
  tenant: null,
  isLoading: true,
  setTenant: (tenant) => set({ tenant, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearTenant: () => set({ tenant: null, isLoading: false }),
}));
