import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SortDirection } from "@/types/api";
import type { AuditLog } from "@/types/audit-log";

interface AuditLogsTableProps {
  auditLogs: AuditLog[];
  currentPage: number;
  isLoading: boolean;
  pageSize: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortDirection: SortDirection) => void;
}

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getActorName = (auditLog: AuditLog): string => {
  if (auditLog.actor) {
    return `${auditLog.actor.firstName} ${auditLog.actor.lastName}`.trim();
  }

  return auditLog.actorId ?? "System";
};

function SortButton({
  activeSortBy,
  direction,
  label,
  sortBy,
  onSortChange,
}: {
  activeSortBy?: string;
  direction?: SortDirection;
  label: string;
  sortBy: string;
  onSortChange: (sortBy: string, sortDirection: SortDirection) => void;
}) {
  const isActive = activeSortBy === sortBy;
  const nextDirection: SortDirection =
    isActive && direction === "asc" ? "desc" : "asc";
  const Icon = !isActive
    ? ChevronsUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900"
      type="button"
      onClick={() => onSortChange(sortBy, nextDirection)}
    >
      {label}
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="h-14 animate-pulse rounded-md bg-slate-100"
          key={index}
        />
      ))}
    </div>
  );
}

export function AuditLogsTable({
  auditLogs,
  currentPage,
  isLoading,
  pageSize,
  sortBy,
  sortDirection,
  totalItems,
  totalPages,
  onPageChange,
  onSortChange,
}: AuditLogsTableProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Audit Logs</h2>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : auditLogs.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-800">
            No audit logs found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Audit events will appear here as users interact with the system.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <SortButton
                      activeSortBy={sortBy}
                      direction={sortDirection}
                      label="Timestamp"
                      sortBy="createdAt"
                      onSortChange={onSortChange}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton
                      activeSortBy={sortBy}
                      direction={sortDirection}
                      label="Action"
                      sortBy="action"
                      onSortChange={onSortChange}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Entity Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {auditLogs.map((auditLog) => (
                  <tr className="hover:bg-slate-50" key={auditLog.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(auditLog.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-950">
                        {getActorName(auditLog)}
                      </p>
                      {auditLog.actor?.email ? (
                        <p className="text-sm text-slate-500">
                          {auditLog.actor.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {auditLog.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {auditLog.entityType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {auditLog.ipAddress ?? "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing {firstItem}-{lastItem} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
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
          </div>
        </>
      )}
    </section>
  );
}
