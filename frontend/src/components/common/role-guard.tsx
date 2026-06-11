import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getDefaultRoute, hasAnyRole } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallbackPath?: string;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallbackPath,
}: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (allowedRoles.length === 0 || hasAnyRole(user, allowedRoles)) {
    return children;
  }

  const redirectPath = fallbackPath ?? getDefaultRoute(user);
  return <Navigate to={redirectPath} replace />;
}
