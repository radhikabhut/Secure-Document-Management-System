import { Download, Eye, Share2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  canDeleteDocument,
  canDownloadDocument,
  canReadDocument,
  canShareDocument,
} from "@/lib/permissions";
import type { User } from "@/types/auth";
import type { Document } from "@/types/document";

interface DocumentActionsProps {
  document: Document;
  isDeleting?: boolean;
  isDownloading?: boolean;
  user?: User | null;
  onDelete: (document: Document) => void;
  onDownload: (document: Document) => void;
  onShare: (document: Document) => void;
}

const buttonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40";

export function DocumentActions({
  document,
  isDeleting,
  isDownloading,
  user,
  onDelete,
  onDownload,
  onShare,
}: DocumentActionsProps) {
  const canView = canReadDocument(user, document);
  const canDownload = canDownloadDocument(user);
  const canShare = canShareDocument(user, document);
  const canDelete = canDeleteDocument(user, document);

  return (
    <div className="flex items-center justify-end gap-1">
      {canView ? (
        <Link
          aria-label={`View ${document.title}`}
          className={buttonClassName}
          to={`/documents/${document.id}`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}

      <button
        aria-label={`Download ${document.title}`}
        className={buttonClassName}
        disabled={!canDownload || isDownloading}
        type="button"
        onClick={() => onDownload(document)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        aria-label={`Share ${document.title}`}
        className={buttonClassName}
        disabled={!canShare}
        type="button"
        onClick={() => onShare(document)}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        aria-label={`Delete ${document.title}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canDelete || isDeleting}
        type="button"
        onClick={() => onDelete(document)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
