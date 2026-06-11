import { Edit, Trash2 } from "lucide-react";
import type { Category } from "@/types/category";

interface CategoriesTableProps {
  categories: Category[];
  currentPage: number;
  isDeleting: boolean;
  isLoading: boolean;
  pageSize: number;
  search: string;
  totalItems: number;
  totalPages: number;
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  canManage?: boolean;
}

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
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

export function CategoriesTable({
  categories,
  currentPage,
  isDeleting,
  isLoading,
  pageSize,
  search,
  totalItems,
  totalPages,
  onDelete,
  onEdit,
  onPageChange,
  onSearchChange,
  canManage = true,
}: CategoriesTableProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-950">Categories</h2>
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:w-72"
          placeholder="Search categories"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : categories.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-800">
            No categories found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Create a category or adjust your search.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Documents
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </th>
                  {canManage && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {categories.map((category) => (
                  <tr className="hover:bg-slate-50" key={category.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-950">
                      {category.name}
                    </td>
                    <td className="max-w-md px-4 py-3 text-sm text-slate-600">
                      <span className="line-clamp-2">
                        {category.description || "No description"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {category.documentCount ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-medium",
                          category.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(category.createdAt)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label={`Edit ${category.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                            type="button"
                            onClick={() => onEdit(category)}
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            aria-label={`Delete ${category.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={isDeleting}
                            type="button"
                            onClick={() => onDelete(category)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
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
