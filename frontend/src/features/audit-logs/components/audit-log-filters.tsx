import type { ChangeEvent } from "react";

export interface AuditLogFiltersValue {
  user: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogFiltersValue;
  onChange: (filters: AuditLogFiltersValue) => void;
}

const actions = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "DOWNLOAD",
  "UPLOAD",
  "SHARE",
  "PERMISSION_CHANGE",
];

export function AuditLogFilters({ filters, onChange }: AuditLogFiltersProps) {
  const updateFilter =
    (key: keyof AuditLogFiltersValue) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...filters, [key]: event.target.value });
    };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px_160px]">
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          placeholder="Filter by user or email"
          type="search"
          value={filters.user}
          onChange={updateFilter("user")}
        />
        <select
          aria-label="Filter by action"
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          value={filters.action}
          onChange={updateFilter("action")}
        >
          <option value="">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <input
          aria-label="Date from"
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          type="date"
          value={filters.dateFrom}
          onChange={updateFilter("dateFrom")}
        />
        <input
          aria-label="Date to"
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          type="date"
          value={filters.dateTo}
          onChange={updateFilter("dateTo")}
        />
      </div>
    </section>
  );
}
