import axios from "axios";
import axiosInstance from "@/lib/axios";
import type {
  ApiResponse,
  PaginationResponse,
  SortDirection,
} from "@/types/api";
import type { AuditLog } from "@/types/audit-log";
import type { Role, User } from "@/types/auth";
import type { Document, DocumentStatus } from "@/types/document";
import type {
  ShareDocumentFormValues,
 
} from "./schemas";

export interface DocumentListParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  type?: string;
  status?: DocumentStatus | "";
  sortBy?: string;
  sortDirection?: SortDirection;
  isDeleted?: boolean;
  from?: string;
  to?: string;
  mimeType?: string;
  uploadedBy?: string;
}

export interface DocumentPermission {
  id: string;
  targetType: "user" | "role";
  targetId: string;
  targetName?: string;
  permissions: string[];
  roles?: string[];
  departments?: string[];
  grantedBy?: User;
  createdAt?: string;
}

export interface DocumentDetails extends Document {
  permissions?: DocumentPermission[];
  auditLogs?: AuditLog[];
}

export interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  categoryId: string;
}

export type DocumentListResponse = PaginationResponse<Document>;

export const documentsQueryKey = {
  all: ["documents"] as const,
  list: (params: DocumentListParams) => ["documents", "list", params] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
};

const mapDocument = (data: any): Document => {
  const uploader = data.uploader ? {
    id: data.uploader.id,
    email: data.uploader.email,
    firstName: (data.uploader.full_name ?? "").split(" ")[0] ?? "",
    lastName: (data.uploader.full_name ?? "").split(" ").slice(1).join(" ") ?? "",
    isActive: data.uploader.is_active,
    createdAt: data.uploader.created_at,
    updatedAt: data.uploader.updated_at,
    roles: [
      {
        id: data.uploader.role_id,
        name: data.uploader.role,
        permissions: [],
      }
    ],
  } : undefined;

  return {
    id: data.id,
    title: data.title,
    description: "",
    fileName: data.original_filename,
    originalFileName: data.original_filename,
    mimeType: data.mime_type,
    fileSize: data.file_size,
    checksum: data.checksum_sha256,
    categoryId: data.category_id,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      description: data.category.description,
      isActive: true,
      createdAt: data.category.created_at,
      updatedAt: data.category.updated_at,
    } : null,
    ownerId: data.uploaded_by,
    owner: uploader,
    status: "APPROVED",
    visibility: "PUBLIC",
    version: data.version,
    tags: [],
    isEncrypted: false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const getDocuments = async (
  params: DocumentListParams,
): Promise<DocumentListResponse> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    "/documents",
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        keyword: params.search,
        category_id: params.categoryId,
        sort_by: params.sortBy === "createdAt" ? "created_at" : params.sortBy,
        sort_order: params.sortDirection,
        is_deleted: params.isDeleted,
        from: params.from,
        to: params.to,
        mime_type: params.mimeType,
        uploaded_by: params.uploadedBy,
      }
    },
  );

  const data = response.data.data;

  return {
    items: (data.items ?? []).map(mapDocument),
    currentPage: data.page,
    pageSize: data.page_size,
    totalItems: data.total_items,
    totalPages: data.total_pages,
    hasNextPage: data.page < data.total_pages,
    hasPreviousPage: data.page > 1,
  };
};

export const getDocumentById = async (id: string): Promise<DocumentDetails> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/documents/${id}`,
  );

  const doc = mapDocument(response.data.data);

  // Fetch permissions and audit logs in parallel
  const [permissionsRes, auditLogsRes] = await Promise.allSettled([
    axiosInstance.get<ApiResponse<any[]>>(`/documents/${id}/permissions`),
    axiosInstance.get<ApiResponse<any>>("/audit-logs", {
      params: {
        entity_type: "DOCUMENT",
        entity_id: id,
      }
    }),
  ]);

  let permissions: DocumentPermission[] = [];
  if (permissionsRes.status === "fulfilled") {
    const rawPerms = permissionsRes.value.data.data ?? [];
    
    // Group permissions by user_id
    const grouped = new Map<string, { id: string, permissions: string[], createdAt: string }>();
    for (const perm of rawPerms) {
      const userId = perm.user_id;
      const type = perm.permission_type;
      const existing = grouped.get(userId);
      if (existing) {
        existing.permissions.push(type);
      } else {
        grouped.set(userId, {
          id: perm.id,
          permissions: [type],
          createdAt: perm.created_at,
        });
      }
    }
    
    permissions = Array.from(grouped, ([userId, info]) => ({
      id: info.id,
      targetType: "user",
      targetId: userId,
      targetName: userId,
      permissions: info.permissions,
      createdAt: info.createdAt,
    }));
  }

  let auditLogs: AuditLog[] = [];
  if (auditLogsRes.status === "fulfilled") {
    const rawLogs = auditLogsRes.value.data.data.items ?? [];
    auditLogs = rawLogs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      actorId: log.user_id,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));
  }

  return {
    ...doc,
    permissions,
    auditLogs,
  };
};

export const uploadDocument = async (
  payload: UploadDocumentPayload,
) => {
  const formData = new FormData();

  formData.append("file", payload.file);
  formData.append("title", payload.title.trim());

  const categoryId = Array.isArray(payload.categoryId)
    ? payload.categoryId[0]
    : payload.categoryId;

  formData.append("category_id", String(categoryId));

  if (payload.description?.trim()) {
    formData.append("description", payload.description.trim());
  }

  const response = await axiosInstance.post(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data;
};

export const downloadDocument = async (document: Document): Promise<void> => {
  const response = await axiosInstance.get<Blob>(
    `/documents/${document.id}/download`,
    {
      responseType: "blob",
    },
  );
  const url = window.URL.createObjectURL(response.data);
  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download =
    document.originalFileName || document.fileName || document.title;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<null>>(`/documents/${id}`);
};

export const hardDeleteDocument = async (id: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<null>>(`/documents/${id}/hard`);
};

export const restoreDocument = async (id: string): Promise<void> => {
  await axiosInstance.post<ApiResponse<null>>(`/documents/${id}/restore`);
};

export const shareDocument = async (
  id: string,
  payload: ShareDocumentFormValues,
): Promise<void> => {
  const permissionMap: Record<string, string> = {
    read: "VIEW",
    download: "DOWNLOAD",
    edit: "EDIT",
    delete: "DELETE",
  };

  const promises: Promise<any>[] = [];
  for (const perm of payload.permissions) {
    const permissionType = permissionMap[perm];
    if (permissionType) {
      promises.push(
        axiosInstance.post<ApiResponse<any>>("/permissions/grant", {
          document_id: id,
          user_ids: payload.userIds,
          roles: payload.roleIds,
          departments: payload.departments,
          permission_type: permissionType,
        })
      );
    }
  }
  await Promise.all(promises);
};

export const getDocumentErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const responseMessage =
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message;

    if (error.response?.status === 400 && responseMessage === "no valid users to share with") {
      return "No other users found in the selected role(s) to share with.";
    }

    return responseMessage ?? "Document request failed.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Document request failed.";
};

export const collectDocumentCategories = (documents: Document[]) => {
  const categories = new Map<string, string>();

  for (const document of documents) {
    if (document.category?.id && document.category.name) {
      categories.set(document.category.id, document.category.name);
    }
  }

  return Array.from(categories, ([id, name]) => ({ id, name }));
};

export const collectDocumentUsers = (documents: Document[]): User[] => {
  const users = new Map<string, User>();

  for (const document of documents) {
    if (document.owner) {
      users.set(document.owner.id, document.owner);
    }
  }

  return Array.from(users.values());
};

export const collectRoles = (user?: User | null): Role[] => user?.roles ?? [];
