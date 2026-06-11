import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAuthErrorMessage, registerRequest } from "@/features/auth/api";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";

export function RegisterForm() {
  const navigate = useNavigate();

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: () => {
      toast.success("Account created successfully");
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      const message = getAuthErrorMessage(error);

      setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-sm text-red-600">{errors.fullName.message}</p>
        ) : null}
      </div>

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
          Confirm password
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
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-medium text-blue-700 underline-offset-4 hover:underline"
          to="/login"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
