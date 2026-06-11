import axios from "axios";
import axiosInstance from "@/lib/axios";
import type {
  ApiResponse,
  PaginationResponse,
  SortDirection,
} from "@/types/api";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/category";
import type { CategoryFormValues } from "./schemas";

export interface CategoryListParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export type CategoryListResponse = PaginationResponse<Category>;

export const categoriesQueryKey = {
  all: ["categories"] as const,
  list: (params: CategoryListParams) => ["categories", "list", params] as const,
};

const mapCategory = (data: any): Category => ({
  id: data.id,
  name: data.name,
  description: data.description,
  documentCount: data.document_count || 0,
  isActive: true,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const toCategoryPayload = (
  values: CategoryFormValues,
): CreateCategoryPayload | UpdateCategoryPayload => ({
  name: values.name.trim(),
  description: values.description?.trim() || undefined,
  parentId: values.parentId || null,
  isActive: values.isActive,
});

export const getCategories = async (
  params: CategoryListParams,
): Promise<CategoryListResponse> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    "/categories",
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        keyword: params.search,
        sort_by: params.sortBy === "createdAt" ? "created_at" : params.sortBy,
        sort_order: params.sortDirection,
      }
    },
  );

  const data = response.data.data;

  return {
    items: (data.items ?? []).map(mapCategory),
    currentPage: data.page,
    pageSize: data.page_size,
    totalItems: data.total_items,
    totalPages: data.total_pages,
    hasNextPage: data.page < data.total_pages,
    hasPreviousPage: data.page > 1,
  };
};

export const createCategory = async (
  values: CategoryFormValues,
): Promise<Category> => {
  const response = await axiosInstance.post<ApiResponse<any>>(
    "/categories",
    toCategoryPayload(values),
  );

  return mapCategory(response.data.data);
};

export const updateCategory = async ({
  id,
  values,
}: {
  id: string;
  values: CategoryFormValues;
}): Promise<Category> => {
  const response = await axiosInstance.put<ApiResponse<any>>(
    `/categories/${id}`,
    toCategoryPayload(values),
  );

  return mapCategory(response.data.data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<null>>(`/categories/${id}`);
};

export const getCategoryErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      "Category request failed."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Category request failed.";
};
