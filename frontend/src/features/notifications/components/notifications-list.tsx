import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@/types/notification";

interface NotificationsListProps {
  currentPage: number;
  isLoading: boolean;
  isMarkingAll: boolean;
  isMarkingOne: boolean;
  notifications: Notification[];
  totalPages: number;
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (notification: Notification) => void;
  onPageChange: (page: number) => void;
}

const relativeTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

function ListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="h-20 animate-pulse rounded-md bg-slate-100"
          key={index}
        />
      ))}
    </div>
  );
}

export function NotificationsList({
  currentPage,
  isLoading,
  isMarkingAll,
  isMarkingOne,
  notifications,
  totalPages,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onPageChange,
}: NotificationsListProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            Notifications
          </h2>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {unreadCount} unread
          </span>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={unreadCount === 0 || isMarkingAll}
          type="button"
          onClick={onMarkAllRead}
        >
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          Mark all as read
        </button>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : notifications.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-800">
            No notifications
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Updates and workflow alerts will appear here.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-200">
            {notifications.map((notification) => (
              <li
                className={[
                  "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between",
                  notification.isRead ? "bg-white" : "bg-blue-50/40",
                ].join(" ")}
                key={notification.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.isRead ? (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-blue-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {notification.title}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {relativeTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead ? (
                  <button
                    className="h-9 shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isMarkingOne}
                    type="button"
                    onClick={() => onMarkRead(notification)}
                  >
                    Mark read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
            <button
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1}
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
            <button
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage >= totalPages}
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
