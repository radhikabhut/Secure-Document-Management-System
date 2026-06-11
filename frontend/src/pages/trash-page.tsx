import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  documentsQueryKey,
  getDocumentErrorMessage,
  getDocuments,
  hardDeleteDocument,
  restoreDocument,
  type DocumentListParams,
} from "@/features/documents/api";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { useAuthStore } from "@/store/auth-store";
import type { SortDirection } from "@/types/api";
import type { Document } from "@/types/document";

export function TrashPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const params: DocumentListParams = useMemo(
    () => ({
      page,
      pageSize,
      sortBy,
      sortDirection,
      isDeleted: true,
    }),
    [page, pageSize, sortBy, sortDirection],
  );

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey.list(params),
    queryFn: () => getDocuments(params),
  });

  const documents = documentsQuery.data?.items ?? [];

  const restoreMutation = useMutation({
    mutationFn: restoreDocument,
    onSuccess: async () => {
      toast.success("Document restored");
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey.all,
      });
    },
    onError: (error) => {
      toast.error(getDocumentErrorMessage(error));
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: hardDeleteDocument,
    onSuccess: async () => {
      toast.success("Document permanently deleted");
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey.all,
      });
    },
    onError: (error) => {
      toast.error(getDocumentErrorMessage(error));
    },
  });

  const handleSortChange = (
    nextSortBy: string,
    nextDirection: SortDirection,
  ) => {
    setSortBy(nextSortBy);
    setSortDirection(nextDirection);
    setPage(1);
  };

  const handleRestore = (document: Document) => {
    const confirmed = window.confirm(`Restore "${document.title}"?`);
    if (confirmed) {
      restoreMutation.mutate(document.id);
    }
  };

  const handleHardDelete = (document: Document) => {
    const confirmed = window.confirm(
      `Permanently delete "${document.title}"? This action cannot be undone.`,
    );
    if (confirmed) {
      hardDeleteMutation.mutate(document.id);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Recycle Bin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Restore recently deleted documents or permanently empty them.
          </p>
        </div>
      </section>

      {documentsQuery.isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {getDocumentErrorMessage(documentsQuery.error)}
            </p>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void documentsQuery.refetch()}>
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <DocumentsTable
        currentPage={documentsQuery.data?.currentPage ?? page}
        documents={documents}
        isLoading={documentsQuery.isLoading}
        pageSize={documentsQuery.data?.pageSize ?? pageSize}
        sortBy={sortBy}
        sortDirection={sortDirection}
        totalItems={documentsQuery.data?.totalItems ?? 0}
        totalPages={documentsQuery.data?.totalPages ?? 1}
        user={user}
        onPageChange={setPage}
        onSortChange={handleSortChange}
        isTrash={true}
        onRestore={handleRestore}
        onHardDelete={handleHardDelete}
        isRestoring={restoreMutation.isPending}
        isHardDeleting={hardDeleteMutation.isPending}
        // Satisfy required props with dummy functions for non-trash context
        onDelete={() => {}}
        onDownload={() => {}}
      />
    </div>
  );
}
