import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  roleAssignmentSchema,
  type RoleAssignmentFormValues,
} from "@/features/users/schemas";
import type { Role, User } from "@/types/auth";

interface RoleAssignmentDialogProps {
  availableRoles: Role[];
  isOpen: boolean;
  isSubmitting: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (values: RoleAssignmentFormValues) => Promise<void>;
}

export function RoleAssignmentDialog({
  availableRoles,
  isOpen,
  isSubmitting,
  user,
  onClose,
  onSubmit,
}: RoleAssignmentDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<RoleAssignmentFormValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      roleIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ roleIds: user?.roles.map((role) => role.id) ?? [] });
    }
  }, [isOpen, reset, user]);

  if (!isOpen || !user) {
    return null;
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const submitForm = async (values: RoleAssignmentFormValues) => {
    try {
      await onSubmit(values);
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to assign roles.";
      setError("root", { message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close role assignment dialog"
        className="absolute inset-0 bg-slate-950/40"
        type="button"
        onClick={handleClose}
      />
      <section className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Assign roles
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {user.firstName} {user.lastName}
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
            {availableRoles.map((role) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-3 py-3 transition hover:bg-slate-50"
                key={role.id}
              >
                <input
                  className="mt-1"
                  type="checkbox"
                  value={role.id}
                  {...register("roleIds")}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-950">
                    {role.name}
                  </span>
                  {role.description ? (
                    <span className="mt-1 block text-sm text-slate-500">
                      {role.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
            {errors.roleIds ? (
              <p className="text-sm text-red-600">{errors.roleIds.message}</p>
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
              {isSubmitting ? "Saving..." : "Save roles"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
