import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/protected-route";
import { RoleGuard } from "@/components/common/role-guard";
import { getDefaultRoute } from "@/lib/permissions";
import { AppLayout } from "@/components/layout/app-layout";
import { AuditLogsPage } from "@/pages/audit-logs-page";
import { CategoriesPage } from "@/pages/categories-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { DocumentDetailsPage } from "@/pages/document-details-page";
import { DocumentsPage } from "@/pages/documents-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { ProfilePage } from "@/pages/profile-page";
import { RegisterPage } from "@/pages/register-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { TrashPage } from "@/pages/trash-page";
import { UsersPage } from "@/pages/users-page";
import { DepartmentsPage } from "@/pages/departments-page";
import { useAuthStore } from "@/store/auth-store";

function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const user = useAuthStore((state) => state.user);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">
        Loading...
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? getDefaultRoute(user) : "/login"} replace />;
}

function AuthInitializer() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "MANAGER"]}>
                <DashboardPage />
              </RoleGuard>
            }
          />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentDetailsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route
            path="/users"
            element={
              <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="/departments"
            element={
              <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                <DepartmentsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "MANAGER"]}>
                <AuditLogsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/trash"
            element={
              <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "MANAGER"]}>
                <TrashPage />
              </RoleGuard>
            }
          />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/logout"
          element={
            <ProtectedRoute>
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
