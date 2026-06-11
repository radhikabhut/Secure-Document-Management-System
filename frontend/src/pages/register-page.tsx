import { Navigate } from "react-router-dom";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getDefaultRoute } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function RegisterPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Join your organization&apos;s secure document workspace.
          </p>
        </div>
        <RegisterForm />
      </section>
    </main>
  );
}
