import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardActivityDataPoint } from "@/features/dashboard/api";

interface ActivityChartProps {
  activity?: DashboardActivityDataPoint[];
  isLoading: boolean;
}

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
};

function ActivitySkeleton() {
  return (
    <div className="h-80 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6 space-y-2">
        <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-52 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-56 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

export function ActivityChart({ activity, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return <ActivitySkeleton />;
  }

  const hasActivity = Boolean(activity?.length);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Recent Activity
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Uploads, downloads, and views over time.
        </p>
      </div>

      {hasActivity ? (
        <div className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={activity}
              margin={{ bottom: 0, left: -20, right: 8, top: 8 }}
            >
              <defs>
                <linearGradient id="uploads" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="downloads" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                tickMargin={10}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgb(15 23 42 / 0.08)",
                }}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Area
                dataKey="uploads"
                fill="url(#uploads)"
                name="Uploads"
                stroke="#2563eb"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="downloads"
                fill="url(#downloads)"
                name="Downloads"
                stroke="#0f766e"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="views"
                fill="transparent"
                name="Views"
                stroke="#64748b"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-80 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <div>
            <p className="text-sm font-medium text-slate-800">
              No recent activity
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Activity will appear here once documents are used.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
