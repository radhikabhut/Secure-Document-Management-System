import { Database, FileText, FolderTree, Upload, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardStatistics } from "@/features/dashboard/api";

interface StatsCardsProps {
  isLoading: boolean;
  statistics?: DashboardStatistics;
}

interface StatCardConfig {
  label: string;
  value: string;
  icon: LucideIcon;
}

const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 0,
});

const formatNumber = (value: number) => numberFormatter.format(value);

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

function StatSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-md bg-slate-200" />
      </div>
    </div>
  );
}

export function StatsCards({ isLoading, statistics }: StatsCardsProps) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </section>
    );
  }

  const cards: StatCardConfig[] = [
    {
      label: "Total Documents",
      value: formatNumber(statistics?.totalDocuments ?? 0),
      icon: FileText,
    },
    {
      label: "Total Users",
      value: formatNumber(statistics?.totalUsers ?? 0),
      icon: Users,
    },
    {
      label: "Total Categories",
      value: formatNumber(statistics?.totalCategories ?? 0),
      icon: FolderTree,
    },
    {
      label: "Storage Used",
      value: formatBytes(statistics?.storageUsedBytes ?? 0),
      icon: Database,
    },
    {
      label: "Uploaded Today",
      value: formatNumber(statistics?.documentsUploadedToday ?? 0),
      icon: Upload,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={card.label}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 truncate text-2xl font-semibold text-slate-950">
                  {card.value}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
