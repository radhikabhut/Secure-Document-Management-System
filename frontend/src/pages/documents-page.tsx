
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {

  deleteDocument,
  documentsQueryKey,
  downloadDocument,
  getDocumentErrorMessage,
  getDocuments,
  shareDocument,
  type DocumentListParams,
} from "@/features/documents/api";
import { getCategories } from "@/features/categories/api";
import { getUsers } from "@/features/users/api";
import {
  DocumentFilters,
  type DocumentFiltersValue,
} from "@/features/documents/components/document-filters";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { ShareDialog } from "@/features/documents/components/share-dialog";
import { UploadDialog } from "@/features/documents/components/upload-dialog";
import type { ShareDocumentFormValues } from "@/features/documents/schemas";
import { canCreateDocument, hasRole } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import type { SortDirection } from "@/types/api";
import type { Document } from "@/types/document";

const defaultFilters: DocumentFiltersValue = {
  search: "",
  categoryId: "",
  mimeType: "",
  status: "",
  from: "",
  to: "",
  uploadedBy: "",
};

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [filters, setFilters] = useState<DocumentFiltersValue>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Document | null>(null);

  const params: DocumentListParams = useMemo(
    () => ({
      page,
      pageSize,
      search: filters.search || undefined,
      categoryId: filters.categoryId || undefined,
      mimeType: filters.mimeType || undefined,
      status: filters.status || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      uploadedBy: filters.uploadedBy || undefined,
      sortBy,
      sortDirection,
    }),
    [filters, page, pageSize, sortBy, sortDirection],
  );

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey.list(params),
    queryFn: () => getDocuments(params),
  });

// Fetch categories directly from the Categories API.
  // This ensures the Upload dialog shows categories even when there are no documents yet.
const categoriesQuery = useQuery({
  queryKey: ["categories"],
  queryFn: () =>
    getCategories({
      page: 1,
      pageSize: 100,
    }),
});

const usersQuery = useQuery({
  queryKey: ["users", "filters"],
  queryFn: () =>
    getUsers({
      page: 1,
      pageSize: 100,
      status: "active",
    }),
});

  const documents = documentsQuery.data?.items ?? [];

  // Transform categories into the shape expected by UploadDialog and DocumentFilters.
  const categories = (categoriesQuery.data?.items ?? []).map((category) => ({
  id: category.id,
  name: category.name,
}));

  const users = (usersQuery.data?.items ?? []).map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim() || u.email,
  }));



  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => {
      toast.success("Document deleted");
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey.all,
      });
    },
    onError: (error) => {
      toast.error(getDocumentErrorMessage(error));
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadDocument,
    onError: (error) => {
      toast.error(getDocumentErrorMessage(error));
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (values: ShareDocumentFormValues) => {
      if (!shareTarget) {
        throw new Error("No document selected.");
      }

      await shareDocument(shareTarget.id, values);
    },
    onSuccess: async () => {
      setShareTarget(null);
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey.all,
      });
    },
    onError: (error) => {
      toast.error(getDocumentErrorMessage(error));
    },
  });

  const handleFilterChange = (nextFilters: DocumentFiltersValue) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSortChange = (
    nextSortBy: string,
    nextDirection: SortDirection,
  ) => {
    setSortBy(nextSortBy);
    setSortDirection(nextDirection);
    setPage(1);
  };

  const handleDelete = (document: Document) => {
    const confirmed = window.confirm(`Delete "${document.title}"?`);

    if (confirmed) {
      deleteMutation.mutate(document.id);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Documents</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse, upload, share, and manage secure documents.
          </p>
        </div>

        {!hasRole(user, 'VIEWER') && (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canCreateDocument(user)}
            type="button"
            onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload
          </button>
        )}
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

      <DocumentFilters
        categories={categories}
        users={users}
        filters={filters}
        onChange={handleFilterChange}
      />

      <DocumentsTable
        currentPage={documentsQuery.data?.currentPage ?? page}
        documents={documents}
        isDeleting={deleteMutation.isPending}
        isDownloading={downloadMutation.isPending}
        isLoading={documentsQuery.isLoading}
        pageSize={documentsQuery.data?.pageSize ?? pageSize}
        sortBy={sortBy}
        sortDirection={sortDirection}
        totalItems={documentsQuery.data?.totalItems ?? 0}
        totalPages={documentsQuery.data?.totalPages ?? 1}
        user={user}
        onDelete={handleDelete}
        onDownload={(document) => downloadMutation.mutate(document)}
        onPageChange={setPage}
        onShare={setShareTarget}
        onSortChange={handleSortChange}
      />

      <UploadDialog
        categories={categories}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() =>
          void queryClient.invalidateQueries({
            queryKey: documentsQueryKey.all,
          })
        }
      />

      <ShareDialog
        document={shareTarget}
        isOpen={Boolean(shareTarget)}
        isSharing={shareMutation.isPending}
        onClose={() => setShareTarget(null)}
        onShare={(values) => shareMutation.mutateAsync(values)}
      />
    </div>
  );
}
