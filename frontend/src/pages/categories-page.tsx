import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  categoriesQueryKey,
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryErrorMessage,
  updateCategory,
  type CategoryListParams,
} from "@/features/categories/api";
import { CategoriesTable } from "@/features/categories/components/categories-table";
import { CategoryFormDialog } from "@/features/categories/components/category-form-dialog";
import { useAuthStore } from "@/store/auth-store";
import { hasAnyRole } from "@/lib/permissions";
import type { CategoryFormValues } from "@/features/categories/schemas";
import type { Category } from "@/types/category";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const canManageCategories = hasAnyRole(user, ['ADMIN', 'MANAGER']);

  const params: CategoryListParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      sortBy: "name",
      sortDirection: "asc",
    }),
    [page, pageSize, search],
  );

  const categoriesQuery = useQuery({
    queryKey: categoriesQueryKey.list(params),
    queryFn: () => getCategories(params),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      toast.success("Category created");
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: async () => {
      toast.success("Category updated");
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      toast.success("Category deleted");
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey.all });
    },
    onError: (error) => toast.error(getCategoryErrorMessage(error)),
  });

  const categories = categoriesQuery.data?.items ?? [];

  const handleSubmit = async (values: CategoryFormValues) => {
    if (selectedCategory) {
      try {
        await updateMutation.mutateAsync({ id: selectedCategory.id, values });
      } catch (error) {
        throw new Error(getCategoryErrorMessage(error));
      }
      return;
    }

    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      throw new Error(getCategoryErrorMessage(error));
    }
  };

  const openCreateDialog = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (window.confirm(`Delete "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Categories</h1>
          <p className="mt-1 text-sm text-slate-600">
            Maintain the taxonomy used to organize secure documents.
          </p>
        </div>
        {canManageCategories && (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800"
            type="button"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add category
          </button>
        )}
      </section>

      {categoriesQuery.isError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {getCategoryErrorMessage(categoriesQuery.error)}
            </p>
            <button
              className="h-9 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={() => void categoriesQuery.refetch()}
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <CategoriesTable
        categories={categories}
        currentPage={categoriesQuery.data?.currentPage ?? page}
        isDeleting={deleteMutation.isPending}
        isLoading={categoriesQuery.isLoading}
        pageSize={categoriesQuery.data?.pageSize ?? pageSize}
        search={search}
        totalItems={categoriesQuery.data?.totalItems ?? 0}
        totalPages={categoriesQuery.data?.totalPages ?? 1}
        onDelete={handleDelete}
        onEdit={openEditDialog}
        onPageChange={setPage}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        canManage={canManageCategories}
      />

      <CategoryFormDialog
        categories={categories}
        category={selectedCategory}
        isOpen={isDialogOpen}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
