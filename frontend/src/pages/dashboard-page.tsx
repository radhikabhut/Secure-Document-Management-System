import { useQuery } from "@tanstack/react-query";
import {
  dashboardQueryKey,
  getDashboardAnalytics,
  getDashboardErrorMessage,
} from "@/features/dashboard/api";
import { ActivityChart } from "@/features/dashboard/components/activity-chart";
import { RecentAuditLogs } from "@/features/dashboard/components/recent-audit-logs";
import { StatsCards } from "@/features/dashboard/components/stats-cards";

export function DashboardPage() {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboardAnalytics,
  });

  return (
    <div className="space-y-6">
      {isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-red-800">
                Dashboard unavailable
              </h2>
              <p className="mt-1 text-sm text-red-700">
                {getDashboardErrorMessage(error)}
              </p>
            </div>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <StatsCards isLoading={isLoading} statistics={data?.statistics} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <ActivityChart activity={data?.activity} isLoading={isLoading} />
        <RecentAuditLogs
          auditLogs={data?.recentAuditLogs}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
