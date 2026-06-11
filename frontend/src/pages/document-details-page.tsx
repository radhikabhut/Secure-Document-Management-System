import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  documentsQueryKey,
  downloadDocument,
  getDocumentById,
  getDocumentErrorMessage,
} from "@/features/documents/api";
import { canDownloadDocument } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import type { AuditLog } from "@/types/audit-log";
import type { Document } from "@/types/document";

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

const getUploaderName = (document: Document): string => {
  if (document.owner) {
    return `${document.owner.firstName} ${document.owner.lastName}`.trim();
  }

  return document.ownerId;
};

function DetailsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-96 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-96 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

function AuditHistory({ auditLogs }: { auditLogs?: AuditLog[] }) {
  if (!auditLogs?.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
        <p className="text-sm font-medium text-slate-800">No audit history</p>
        <p className="mt-1 text-sm text-slate-500">
          Document activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
      {auditLogs.map((auditLog) => (
        <li className="px-4 py-3" key={auditLog.id}>
          <p className="text-sm font-medium text-slate-950">
            {auditLog.action} {auditLog.entityType}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {formatDateTime(auditLog.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function DocumentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const documentQuery = useQuery({
    enabled: Boolean(id),
    queryKey: documentsQueryKey.detail(id ?? ""),
    queryFn: () => getDocumentById(id ?? ""),
  });

  const downloadMutation = useMutation({
    mutationFn: downloadDocument,
    onError: (error) => toast.error(getDocumentErrorMessage(error)),
  });

  if (documentQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (documentQuery.isError || !documentQuery.data) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          {getDocumentErrorMessage(documentQuery.error)}
        </p>
      </section>
    );
  }

  const document = documentQuery.data;
  const canDownload = canDownloadDocument(user);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold text-slate-950">
                {document.title}
              </h1>
              <p className="mt-1 truncate text-sm text-slate-500">
                {document.originalFileName || document.fileName}
              </p>
            </div>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canDownload || downloadMutation.isPending}
            type="button"
            onClick={() => downloadMutation.mutate(document)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Metadata</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Category</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {document.category?.name ?? "Uncategorized"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">
                Uploaded By
              </dt>
              <dd className="mt-1 text-sm text-slate-950">
                {getUploaderName(document)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Size</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {formatBytes(document.fileSize)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Type</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {document.mimeType}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-950">{document.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Visibility</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {document.visibility}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Created At</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {formatDateTime(document.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Updated At</dt>
              <dd className="mt-1 text-sm text-slate-950">
                {formatDateTime(document.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-slate-950">
              Audit History
            </h3>
            <div className="mt-3">
              <AuditHistory auditLogs={document.auditLogs} />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Permissions
            </h2>
            {document.permissions?.length ? (
              <ul className="mt-4 space-y-3">
                {document.permissions.map((permission) => (
                  <li
                    className="rounded-md border border-slate-200 px-3 py-3"
                    key={permission.id}
                  >
                    <p className="text-sm font-medium text-slate-950">
                      {permission.targetName ?? permission.targetId}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {permission.targetType}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {permission.permissions.map((item) => (
                        <span
                          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No explicit permissions assigned.
              </div>
            )}
          </section>

          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            to="/documents"
          >
            Back to documents
          </Link>
        </aside>
      </div>
    </div>
  );
}
