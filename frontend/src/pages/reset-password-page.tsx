import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  getAuthErrorMessage,
  resetPasswordRequest,
} from "@/features/auth/api";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";
import { getDefaultRoute } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      const message = getAuthErrorMessage(error);
      setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    resetPasswordMutation.mutate({ token, values });
  };

  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-medium text-red-600">
            Invalid or missing reset token. Please request a new password reset link.
          </p>
          <div className="mt-6">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800"
              to="/forgot-password"
            >
              Request Reset Link
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            DocuVault
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your new password below.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="password"
            >
              New Password
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {errors.root?.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          ) : null}

          <button
            className="h-10 w-full rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            className="text-sm font-medium text-blue-700 underline-offset-4 hover:underline"
            to="/login"
          >
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
