import type { AuditLog } from "@/types/audit-log";

interface RecentAuditLogsProps {
  auditLogs?: AuditLog[];
  isLoading: boolean;
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

const formatActorName = (auditLog: AuditLog): string => {
  if (auditLog.actor) {
    return `${auditLog.actor.firstName} ${auditLog.actor.lastName}`.trim();
  }

  return auditLog.actorId ?? "System";
};

function AuditLogSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 space-y-2">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="h-14 animate-pulse rounded-md bg-slate-100"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export function RecentAuditLogs({
  auditLogs,
  isLoading,
}: RecentAuditLogsProps) {
  if (isLoading) {
    return <AuditLogSkeleton />;
  }

  const hasLogs = Boolean(auditLogs?.length);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Recent Audit Logs
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Latest security and document activity.
        </p>
      </div>

      {hasLogs ? (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Event</span>
            <span className="hidden sm:block">Time</span>
          </div>
          <ul className="divide-y divide-slate-200">
            {auditLogs?.map((auditLog) => (
              <li
                className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
                key={auditLog.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {auditLog.action} {auditLog.entityType}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {formatActorName(auditLog)}
                    {auditLog.entityId ? ` • ${auditLog.entityId}` : ""}
                  </p>
                </div>
                <time
                  className="text-sm text-slate-500"
                  dateTime={auditLog.createdAt}
                >
                  {formatDateTime(auditLog.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-800">
            No audit logs yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Recent audit events will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
