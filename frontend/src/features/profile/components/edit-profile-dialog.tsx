import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { userFormSchema, type UserFormValues } from "@/features/users/schemas";
import type { User } from "@/types/auth";

interface EditProfileDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

export function EditProfileDialog({
  isOpen,
  isSubmitting,
  user,
  onClose,
  onSubmit,
}: EditProfileDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        username: user?.username ?? "",
      });
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

  const submitForm = async (values: UserFormValues) => {
    try {
      await onSubmit(values);
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save profile.";
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
            <h2 className="text-lg font-semibold text-slate-950">Edit Profile</h2>
            <p className="mt-1 text-sm text-slate-600">
              Update your personal information.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="firstName"
              >
                First name
              </label>
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                id="firstName"
                type="text"
                {...register("firstName")}
              />
              {errors.firstName ? (
                <p className="text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="lastName"
              >
                Last name
              </label>
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                id="lastName"
                type="text"
                {...register("lastName")}
              />
              {errors.lastName ? (
                <p className="text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
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

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="username"
            >
              Username
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
