import axios from "axios";
import axiosInstance from "@/lib/axios";
import type {
  ApiResponse,
  PaginationResponse,
  SortDirection,
} from "@/types/api";
import type { Role, User } from "@/types/auth";
import type {
  CreateUserFormValues,
  RoleAssignmentFormValues,
  UserFormValues,
} from "./schemas";

export interface UserListParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  status?: "active" | "inactive" | "";
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface UpdateUserStatusPayload {
  isActive: boolean;
}

export type UserListResponse = PaginationResponse<User>;

export const usersQueryKey = {
  all: ["users"] as const,
  list: (params: UserListParams) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export const standardRoles: Role[] = [
  {
    id: "SUPER_ADMIN",
    name: "SUPER_ADMIN",
    description: "Full system access",
    permissions: ["*"],
    isSystem: true,
  },
  {
    id: "ADMIN",
    name: "ADMIN",
    description: "Administrative access",
    permissions: [],
    isSystem: true,
  },
  {
    id: "MANAGER",
    name: "MANAGER",
    description: "Team and document workflow access",
    permissions: [],
    isSystem: true,
  },
  {
    id: "EMPLOYEE",
    name: "EMPLOYEE",
    description: "Standard document access",
    permissions: [],
    isSystem: true,
  },
  {
    id: "VIEWER",
    name: "VIEWER",
    description: "Read-only access",
    permissions: [],
    isSystem: true,
  },
];

/**
 * Backend user shape returned by the API.
 */
interface BackendUser {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  role_id: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert backend response to frontend User model.
 */
const mapUser = (data: BackendUser): User => {
  const nameParts = (data.full_name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: data.id,
    email: data.email,
    firstName,
    lastName,
    username: data.username || data.email.split("@")[0],
    avatarUrl: undefined,
    isActive: data.is_active,
    isEmailVerified: true,
    lastLoginAt: data.last_login_at ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    roles: [
      {
        id: data.role_id,
        name: data.role,
        description: data.role,
        permissions: [],
        isSystem: true,
      },
    ],
  };
};

const toUserPayload = (values: UserFormValues) => ({
  full_name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
  username: values.username?.trim() || undefined,
});

export const getUsers = async (
  params: UserListParams,
): Promise<UserListResponse> => {
  const response = await axiosInstance.get<ApiResponse<any>>("/users", {
    params: {
      page: params.page,
      page_size: params.pageSize,
      keyword: params.search,
      role_id: params.role,
      is_active: params.status === "active" ? true : params.status === "inactive" ? false : undefined,
      sort_by: params.sortBy === "createdAt" ? "created_at" : params.sortBy,
      sort_order: params.sortDirection,
    },
  });

  const data = response.data.data;

  return {
    items: (data.items ?? []).map(mapUser),
    currentPage: data.page,
    pageSize: data.page_size,
    totalItems: data.total_items,
    totalPages: data.total_pages,
    hasNextPage: data.page < data.total_pages,
    hasPreviousPage: data.page > 1,
  };
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await axiosInstance.get<ApiResponse<any>>(`/users/${id}`);

  return mapUser(response.data.data.user ?? response.data.data);
};

export const createUser = async (values: CreateUserFormValues): Promise<User> => {
  const payload = {
    full_name: values.fullName.trim(),
    username: values.username?.trim() || undefined,
    email: values.email.trim(),
    password: values.password,
    role: values.role || undefined,
  };

  const response = await axiosInstance.post<ApiResponse<any>>("/users", payload);

  return mapUser(response.data.data.user ?? response.data.data);
};

export const updateUser = async ({
  id,
  values,
}: {
  id: string;
  values: UserFormValues;
}): Promise<User> => {
  const response = await axiosInstance.put<ApiResponse<any>>(
    `/users/${id}`,
    toUserPayload(values),
  );

  return mapUser(response.data.data.user ?? response.data.data);
};

export const updateUserStatus = async ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}): Promise<User> => {
  const response = await axiosInstance.put<ApiResponse<any>>(
    `/users/${id}`,
    { is_active: isActive },
  );

  return mapUser(response.data.data.user ?? response.data.data);
};

export const assignUserRoles = async ({
  id,
  values,
}: {
  id: string;
  values: RoleAssignmentFormValues;
}): Promise<User> => {
  const response = await axiosInstance.put<ApiResponse<any>>(
    `/users/${id}`,
    { role: values.roleIds[0] },
  );

  return mapUser(response.data.data.user ?? response.data.data);
};

export const deleteUser = async (id: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<null>>(`/users/${id}`);
};

export const getUserErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      "User request failed."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "User request failed.";
};