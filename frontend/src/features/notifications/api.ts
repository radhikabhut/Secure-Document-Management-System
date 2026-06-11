import axios from "axios";
import axiosInstance from "@/lib/axios";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type { Notification } from "@/types/notification";

export interface NotificationListParams {
  page: number;
  pageSize: number;
}

export interface NotificationListResponse extends PaginationResponse<Notification> {
  unreadCount: number;
}

export const notificationsQueryKey = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) =>
    ["notifications", "list", params] as const,
};

const mapNotification = (data: any): Notification => ({
  id: data.id,
  userId: data.user_id,
  type: data.type,
  title: data.subject,
  message: data.message,
  isRead: data.is_read,
  readAt: data.read_at,
  createdAt: data.created_at,
});

export const getNotifications = async (
  params: NotificationListParams,
): Promise<NotificationListResponse> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    "/notifications",
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
      }
    },
  );

  const data = response.data.data;
  const items: Notification[] = (data.items ?? []).map(mapNotification);

  return {
    items,
    currentPage: data.page,
    pageSize: data.page_size,
    totalItems: data.total_items,
    totalPages: data.total_pages,
    hasNextPage: data.page < data.total_pages,
    hasPreviousPage: data.page > 1,
    unreadCount: items.filter((item) => !item.isRead).length,
  };
};

export const markNotificationAsRead = async (
  id: string,
): Promise<Notification> => {
  const response = await axiosInstance.patch<ApiResponse<any>>(`/notifications/${id}/read`);
  return mapNotification(response.data.data);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  // Mock success locally since there is no backend endpoint
};

export const getNotificationErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      "Notification request failed."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Notification request failed.";
};
