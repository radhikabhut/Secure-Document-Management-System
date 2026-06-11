import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/features/categories/schemas";
import type { Category } from "@/types/category";

interface CategoryFormDialogProps {
  categories: Category[];
  category?: Category | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function CategoryFormDialog({
  categories,
  category,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: category?.name ?? "",
        description: category?.description ?? "",
        parentId: category?.parentId ?? "",
        isActive: category?.isActive ?? true,
      });
    }
  }, [category, isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const submitForm = async (values: CategoryFormValues) => {
    try {
      await onSubmit(values);
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save category.";
      setError("root", { message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close category dialog"
        className="absolute inset-0 bg-slate-950/40"
        type="button"
        onClick={handleClose}
      />
      <section className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {category ? "Edit category" : "Add category"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Organize documents into searchable groups.
            </p>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            disabled={isSubmitting}
            type="button"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit(submitForm)}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="name"
            >
              Name
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="name"
              type="text"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="description"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="parentId"
            >
              Parent category
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="parentId"
              {...register("parentId")}
            >
              <option value="">None</option>
              {categories
                .filter((item) => item.id !== category?.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" {...register("isActive")} />
            Active
          </label>

          {errors.root?.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
