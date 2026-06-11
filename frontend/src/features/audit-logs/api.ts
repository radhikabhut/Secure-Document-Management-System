import axios from "axios";
import axiosInstance from "@/lib/axios";
import type {
  ApiResponse,
  PaginationResponse,
  SortDirection,
} from "@/types/api";
import type { AuditAction, AuditLog } from "@/types/audit-log";

export interface AuditLogListParams {
  page: number;
  pageSize: number;
  user?: string;
  action?: AuditAction | string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export type AuditLogListResponse = PaginationResponse<AuditLog>;

export const auditLogsQueryKey = {
  all: ["audit-logs"] as const,
  list: (params: AuditLogListParams) => ["audit-logs", "list", params] as const,
};

const mapAuditLog = (data: any): AuditLog => ({
  id: data.id,
  action: data.action,
  entityType: data.entity_type,
  entityId: data.entity_id,
  actorId: data.user_id,
  actor: undefined,
  ipAddress: data.ip_address,
  userAgent: data.user_agent,
  metadata: data.metadata,
  createdAt: data.created_at,
});

export const getAuditLogs = async (
  params: AuditLogListParams,
): Promise<AuditLogListResponse> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    "/audit-logs",
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        user_id: params.user,
        action: params.action,
        from: params.dateFrom,
        to: params.dateTo,
        sort_by: params.sortBy === "createdAt" ? "created_at" : params.sortBy,
        sort_order: params.sortDirection,
      }
    },
  );

  const data = response.data.data;

  return {
    items: (data.items ?? []).map(mapAuditLog),
    currentPage: data.page,
    pageSize: data.page_size,
    totalItems: data.total_items,
    totalPages: data.total_pages,
    hasNextPage: data.page < data.total_pages,
    hasPreviousPage: data.page > 1,
  };
};

export const getAuditLogErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      "Unable to load audit logs."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load audit logs.";
};
