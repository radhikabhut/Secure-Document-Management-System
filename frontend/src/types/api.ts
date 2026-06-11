export interface ApiError {
  code?: string;
  field?: string;
  message: string;
}

export interface ApiResponse<TData = unknown> {
  success: boolean;
  message: string;
  data: TData;
  errors?: ApiError[];
  timestamp?: string;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationResponse<TItem = unknown> extends PaginationMeta {
  items: TItem[];
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortDirection?: SortDirection;
}

export type ApiListParams = PaginationParams & SortParams;
