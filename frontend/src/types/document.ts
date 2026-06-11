import type { User } from './auth';
import type { Category } from './category';

export type DocumentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'DELETED';

export type DocumentVisibility = 'PRIVATE' | 'TEAM' | 'ORGANIZATION' | 'PUBLIC';

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  checksum?: string;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  categoryId?: string | null;
  category?: Category | null;
  ownerId: string;
  owner?: User;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  version: number;
  versions?: DocumentVersion[];
  tags: string[];
  isEncrypted: boolean;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateDocumentPayload {
  title: string;
  description?: string;
  categoryId?: string | null;
  visibility?: DocumentVisibility;
  tags?: string[];
  file: File;
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  categoryId?: string | null;
  status?: DocumentStatus;
  visibility?: DocumentVisibility;
  tags?: string[];
}
