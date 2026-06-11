import axios from "axios";
import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AuditLog } from "@/types/audit-log";

export interface DashboardStatistics {
  totalDocuments: number;
  totalUsers: number;
  totalCategories: number;
  storageUsedBytes: number;
  documentsUploadedToday: number;
}

export interface DashboardActivityDataPoint {
  date: string;
  uploads: number;
  downloads: number;
  views: number;
}

export interface DashboardAnalytics {
  statistics: DashboardStatistics;
  activity: DashboardActivityDataPoint[];
  recentAuditLogs: AuditLog[];
}

export const dashboardQueryKey = ["dashboard"] as const;

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const response = await axiosInstance.get<ApiResponse<any>>("/dashboard");
  const data = response.data.data;

  return {
    statistics: {
      totalDocuments: data.total_documents ?? 0,
      totalUsers: data.total_users ?? 0,
      totalCategories: data.total_categories ?? 0,
      storageUsedBytes: data.storage_usage_bytes ?? 0,
      documentsUploadedToday: data.documents_uploaded_today ?? 0,
    },
    activity: [],
    recentAuditLogs: (data.recent_audit_events ?? []).map((log: any) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      actorId: log.user_id,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      metadata: log.metadata,
      createdAt: log.created_at,
    })),
  };
};

export const getDashboardErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      "Unable to load dashboard analytics."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load dashboard analytics.";
};
