import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAuthErrorMessage, loginRequest } from "@/features/auth/api";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { getDefaultRoute } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm() {
  const navigate = useNavigate();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      setAuthSession(session);
      toast.success("Signed in successfully");
      navigate(getDefaultRoute(session.user), { replace: true });
    },
    onError: (error) => {
      const message = getAuthErrorMessage(error);

      setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="password"
          >
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-700 hover:underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </div>
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
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

      <button
        className="h-10 w-full rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link
          className="font-medium text-blue-700 underline-offset-4 hover:underline"
          to="/register"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
