import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  forgotPasswordRequest,
  getAuthErrorMessage,
} from "@/features/auth/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas";
import { getDefaultRoute } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function ForgotPasswordPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const {
    formState: { errors, isSubmitSuccessful },
    handleSubmit,
    register,
    setError,
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordRequest,
    onSuccess: () => {
      toast.success("Password reset email sent.");
      reset();
    },
    onError: (error) => {
      const message = getAuthErrorMessage(error);
      setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values);
  };

  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            DocuVault
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {isSubmitSuccessful && !forgotPasswordMutation.isError ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
              If your email is registered, you will receive a password reset link.
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-red-600">{errors.email.message}</p>
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
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

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
