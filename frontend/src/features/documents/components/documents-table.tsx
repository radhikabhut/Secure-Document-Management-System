import { ArrowDown, ArrowUp, ChevronsUpDown, RefreshCw, Trash2 } from "lucide-react";
import { DocumentActions } from "@/features/documents/components/document-actions";
import { hasRole } from "@/lib/permissions";
import type { SortDirection } from "@/types/api";
import type { User } from "@/types/auth";
import type { Document } from "@/types/document";

interface DocumentsTableProps {
  currentPage: number;
  documents: Document[];
  isDeleting?: boolean;
  isDownloading?: boolean;
  isLoading: boolean;
  pageSize: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  totalItems: number;
  totalPages: number;
  user?: User | null;
  onDelete: (document: Document) => void;
  onDownload: (document: Document) => void;
  onPageChange: (page: number) => void;
  onShare?: (document: Document) => void;
  onSortChange: (sortBy: string, sortDirection: SortDirection) => void;
  isTrash?: boolean;
  isRestoring?: boolean;
  isHardDeleting?: boolean;
  onRestore?: (document: Document) => void;
  onHardDelete?: (document: Document) => void;
}

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

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getUploaderName = (document: Document): string => {
  if (document.owner) {
    return `${document.owner.firstName} ${document.owner.lastName}`.trim();
  }

  return document.ownerId;
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
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="h-14 animate-pulse rounded-md bg-slate-100"
          key={index}
        />
      ))}
    </div>
  );
}

export function DocumentsTable({
  currentPage,
  documents,
  isDeleting,
  isDownloading,
  isLoading,
  pageSize,
  sortBy,
  sortDirection,
  totalItems,
  totalPages,
  user,
  onDelete,
  onDownload,
  onPageChange,
  onShare,
  onSortChange,
  isTrash,
  isRestoring,
  isHardDeleting,
  onRestore,
  onHardDelete,
}: DocumentsTableProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Documents</h2>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : documents.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-800">
            No documents found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a document or adjust your filters.
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
                      label="Title"
                      sortBy="title"
                      onSortChange={onSortChange}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Uploaded By
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton
                      activeSortBy={sortBy}
                      direction={sortDirection}
                      label="Size"
                      sortBy="fileSize"
                      onSortChange={onSortChange}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton
                      activeSortBy={sortBy}
                      direction={sortDirection}
                      label="Created At"
                      sortBy="createdAt"
                      onSortChange={onSortChange}
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {documents.map((document) => (
                  <tr className="hover:bg-slate-50" key={document.id}>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-950">
                        {document.title}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {document.originalFileName || document.fileName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {document.category?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {getUploaderName(document)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatBytes(document.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {document.mimeType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(document.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isTrash ? (
                        <div className="flex justify-end gap-1">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Restore"
                            disabled={isRestoring}
                            type="button"
                            onClick={() => onRestore?.(document)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          {hasRole(user, 'ADMIN') && (
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Permanently Delete"
                              disabled={isHardDeleting}
                              type="button"
                              onClick={() => onHardDelete?.(document)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <DocumentActions
                          document={document}
                          isDeleting={isDeleting}
                          isDownloading={isDownloading}
                          user={user}
                          onDelete={onDelete}
                          onDownload={onDownload!}
                          onShare={onShare!}
                        />
                      )}
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
