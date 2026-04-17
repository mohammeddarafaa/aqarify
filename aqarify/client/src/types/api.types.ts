export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface UnitFilters {
  type?: string;
  bedrooms?: number;
  min_price?: number;
  max_price?: number;
  min_size?: number;
  max_size?: number;
  floor?: number;
  finishing?: string;
  view_type?: string;
  status?: "available" | "reserved" | "sold";
  building_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}
