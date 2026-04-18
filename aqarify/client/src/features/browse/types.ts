export interface Unit {
  id: string;
  unit_number: string;
  floor: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  price: number;
  reservation_fee: number;
  down_payment_pct: number;
  installment_months: number;
  status: "available" | "reserved" | "sold";
  gallery: string[];
  view_type: string | null;
  finishing: string | null;
  virtual_tour_url?: string | null;
  floor_plan_url?: string | null;
  building_id: string;
  project_id: string;
  location_lat?: number | null;
  location_lng?: number | null;
}

export interface BrowseFilters {
  /** When set, limits units to this project (public browse project drill-down). */
  project_id?: string;
  type?: string;
  bedrooms?: string;
  status?: string;
  search?: string;
  location?: string;
  [key: string]: string | undefined;
}
