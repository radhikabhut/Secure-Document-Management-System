import { Edit, ShieldCheck, Trash2 } from "lucide-react";
import type { UserListParams } from "@/features/users/api";
import type { SortDirection } from "@/types/api";
import type { User } from "@/types/auth";

interface UsersTableProps {
  currentPage: number;
  filters: Pick<UserListParams, "search" | "role" | "status">;
  isLoading: boolean;
  isStatusUpdating: boolean;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  users: User[];
  onEdit: (user: User) => void;
  onFilterChange: (
    filters: Pick<UserListParams, "search" | "role" | "status">,
  ) => void;
  onPageChange: (page: number) => void;
  onRoleAssign: (user: User) => void;
  onSortChange: (sortBy: string, sortDirection: SortDirection) => void;
  onStatusToggle: (user: User) => void;
  onDelete: (user: User) => void;
}

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

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="h-14 animate-pulse rounded-md bg-slate-100"
          key={index}
        />
      ))}
    </div>
  );
}

export function UsersTable({
  currentPage,
  filters,
  isLoading,
  isStatusUpdating,
  pageSize,
  totalItems,
  totalPages,
  users,
  onEdit,
  onFilterChange,
  onPageChange,
  onRoleAssign,
  onSortChange,
  onStatusToggle,
  onDelete,
}: UsersTableProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 px-4 py-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px]">
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          placeholder="Search users"
          type="search"
          value={filters.search ?? ""}
          onChange={(event) =>
            onFilterChange({ ...filters, search: event.target.value })
          }
        />
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          value={filters.role ?? ""}
          onChange={(event) =>
            onFilterChange({ ...filters, role: event.target.value })
          }
        >
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          value={filters.status ?? ""}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              status: event.target.value as UserListParams["status"],
            })
          }
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : users.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-800">No users found</p>
          <p className="mt-1 text-sm text-slate-500">
            Adjust filters to find a user.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900"
                      type="button"
                      onClick={() => onSortChange("firstName", "asc")}
                    >
                      User
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Roles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr className="hover:bg-slate-50" key={user.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-950">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.roles ?? []).length > 0 ? (
                        (user.roles ?? []).map((role, index) => (
                          <span
                            className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            key={role.id ?? `${user.id}-${index}`}
                          >
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No role assigned</span>
                      )}
                    </div>
                  </td>
                    <td className="px-4 py-3">
                      <button
                        className={[
                          "rounded-full px-2 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        ].join(" ")}
                        disabled={isStatusUpdating}
                        type="button"
                        onClick={() => onStatusToggle(user)}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Edit ${user.email}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                          type="button"
                          onClick={() => onEdit(user)}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Assign roles for ${user.email}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                          type="button"
                          onClick={() => onRoleAssign(user)}
                        >
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Delete ${user.email}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-700"
                          type="button"
                          onClick={() => onDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
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
