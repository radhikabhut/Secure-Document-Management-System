import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { standardRoles } from "@/features/users/api";
import { createUserSchema, type CreateUserFormValues } from "@/features/users/schemas";
import { getDepartments } from "@/features/departments/api";

interface CreateUserDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserFormValues) => Promise<void>;
}

export function CreateUserDialog({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateUserDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      password: "",
      role: "",
      departmentId: "",
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const submitForm = async (values: CreateUserFormValues) => {
    try {
      await onSubmit(values);
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create user.";
      setError("root", { message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/40"
        type="button"
        onClick={handleClose}
      />
      <section className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Create New User</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a new user to the system.
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
              htmlFor="fullName"
            >
              Full name
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="fullName"
              type="text"
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="text-sm text-red-600">
                {errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="email"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="username"
              >
                Username (Optional)
              </label>
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                id="username"
                type="text"
                {...register("username")}
              />
              {errors.username ? (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="role"
              >
                Role
              </label>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                id="role"
                {...register("role")}
              >
                <option value="">Default (Employee)</option>
                {standardRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role ? (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="departmentId"
              >
                Department
              </label>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                id="departmentId"
                {...register("departmentId")}
              >
                <option value="">None</option>
                {departmentsQuery.data?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId ? (
                <p className="text-sm text-red-600">{errors.departmentId.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

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
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
