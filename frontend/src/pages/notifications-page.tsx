import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getNotificationErrorMessage,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationsQueryKey,
  type NotificationListParams,
} from "@/features/notifications/api";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import type { Notification } from "@/types/notification";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const params: NotificationListParams = useMemo(
    () => ({
      page,
      pageSize,
    }),
    [page, pageSize],
  );

  const notificationsQuery = useQuery({
    queryKey: notificationsQueryKey.list(params),
    queryFn: () => getNotifications(params),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async (_, id) => {
      // Optimistically update the cache to reflect the read state immediately
      queryClient.setQueryData(
        notificationsQueryKey.list(params),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((item: Notification) =>
              item.id === id ? { ...item, isRead: true } : item
            ),
            unreadCount: Math.max(0, oldData.unreadCount - 1),
          };
        }
      );

      // Invalidate to ensure background consistency
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKey.all,
      });
    },
    onError: (error) => toast.error(getNotificationErrorMessage(error)),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      toast.success("All notifications marked as read");
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKey.all,
      });
    },
    onError: (error) => toast.error(getNotificationErrorMessage(error)),
  });

  const handleMarkRead = (notification: Notification) => {
    markReadMutation.mutate(notification.id);
  };

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold text-slate-950">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track document workflow updates and account alerts.
        </p>
      </section>

      {notificationsQuery.isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {getNotificationErrorMessage(notificationsQuery.error)}
            </p>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void notificationsQuery.refetch()}
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <NotificationsList
        currentPage={notificationsQuery.data?.currentPage ?? page}
        isLoading={notificationsQuery.isLoading}
        isMarkingAll={markAllReadMutation.isPending}
        isMarkingOne={markReadMutation.isPending}
        notifications={notificationsQuery.data?.items ?? []}
        totalPages={notificationsQuery.data?.totalPages ?? 1}
        unreadCount={notificationsQuery.data?.unreadCount ?? 0}
        onMarkAllRead={() => markAllReadMutation.mutate()}
        onMarkRead={handleMarkRead}
        onPageChange={setPage}
      />
    </div>
  );
}
