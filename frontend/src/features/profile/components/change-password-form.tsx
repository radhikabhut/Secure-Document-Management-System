import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(128, "New password must be 128 characters or fewer"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async () => {
    toast.info("Password change endpoint is not connected yet.");
    reset();
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Change Password
        </h2>

      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="currentPassword"
          >
            Current password
          </label>
          <input
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...register("currentPassword")}
          />
          {errors.currentPassword ? (
            <p className="text-sm text-red-600">
              {errors.currentPassword.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="newPassword"
          >
            New password
          </label>
          <input
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
          />
          {errors.newPassword ? (
            <p className="text-sm text-red-600">{errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <button
          className="h-10 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : "Update password"}
        </button>
      </form>
    </section>
  );
}
