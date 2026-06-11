import type { User } from "@/types/auth";

interface ProfileCardProps {
  isLoading: boolean;
  user?: User | null;
  onEdit?: () => void;
}

const getInitials = (user?: User | null): string => {
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return initials || user?.email?.[0]?.toUpperCase() || "U";
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function ProfileSkeleton() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </section>
  );
}

export function ProfileCard({ isLoading, user, onEdit }: ProfileCardProps) {
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">
          Profile unavailable
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Your account details could not be loaded.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
          {getInitials(user)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold text-slate-950">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={[
                  "w-fit rounded-full px-2 py-1 text-xs font-medium",
                  user.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Username</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {user.username ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">
                Email verified
              </dt>
              <dd className="mt-1 text-sm text-slate-950">
                {user.isEmailVerified ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Last login</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {formatDate(user.lastLoginAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Created</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {formatDate(user.createdAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-500">Roles</p>
            <div className="mt-2 flex flex-wrap gap-2">
           {(user.roles ?? []).length > 0 ? (
  (user.roles ?? []).map((role) => (
    <span
      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
      key={role.id}
    >
      {role.name}
    </span>
  ))
) : (
  <span className="text-sm text-slate-500">No roles assigned</span>
)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
