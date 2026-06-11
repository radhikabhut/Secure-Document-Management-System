import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  auditLogsQueryKey,
  getAuditLogErrorMessage,
  getAuditLogs,
  type AuditLogListParams,
} from "@/features/audit-logs/api";
import {
  AuditLogFilters,
  type AuditLogFiltersValue,
} from "@/features/audit-logs/components/audit-log-filters";
import { AuditLogsTable } from "@/features/audit-logs/components/audit-logs-table";
import type { SortDirection } from "@/types/api";

const defaultFilters: AuditLogFiltersValue = {
  user: "",
  action: "",
  dateFrom: "",
  dateTo: "",
};

export function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFiltersValue>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const params: AuditLogListParams = useMemo(
    () => ({
      page,
      pageSize,
      user: filters.user || undefined,
      action: filters.action || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy,
      sortDirection,
    }),
    [filters, page, pageSize, sortBy, sortDirection],
  );

  const auditLogsQuery = useQuery({
    queryKey: auditLogsQueryKey.list(params),
    queryFn: () => getAuditLogs(params),
  });

  const handleFiltersChange = (nextFilters: AuditLogFiltersValue) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSortChange = (
    nextSortBy: string,
    nextDirection: SortDirection,
  ) => {
    setSortBy(nextSortBy);
    setSortDirection(nextDirection);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold text-slate-950">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review security, access, and document activity across the system.
        </p>
      </section>

      {auditLogsQuery.isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {getAuditLogErrorMessage(auditLogsQuery.error)}
            </p>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void auditLogsQuery.refetch()}
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <AuditLogFilters filters={filters} onChange={handleFiltersChange} />

      <AuditLogsTable
        auditLogs={auditLogsQuery.data?.items ?? []}
        currentPage={auditLogsQuery.data?.currentPage ?? page}
        isLoading={auditLogsQuery.isLoading}
        pageSize={auditLogsQuery.data?.pageSize ?? pageSize}
        sortBy={sortBy}
        sortDirection={sortDirection}
        totalItems={auditLogsQuery.data?.totalItems ?? 0}
        totalPages={auditLogsQuery.data?.totalPages ?? 1}
        onPageChange={setPage}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
