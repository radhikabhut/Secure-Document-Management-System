import type { LucideIcon } from "lucide-react";
import {
  Bell,
  FileClock,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Building2,
  Trash2,
} from "lucide-react";
import { hasAnyPermission, hasAnyRole } from "@/lib/permissions";
import type { User as AuthUser } from "@/types/auth";

export type NavItemType = "link" | "action";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  type?: NavItemType;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    requiredRoles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
  },
  {
    label: "Documents",
    path: "/documents",
    icon: FileText,
  },
  {
    label: "Categories",
    path: "/categories",
    icon: FolderTree,
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
    requiredRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    label: "Departments",
    path: "/departments",
    icon: Building2,
    requiredRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    label: "Audit Logs",
    path: "/audit-logs",
    icon: FileClock,
    requiredRoles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    requiredPermissions: ["audit-logs:read"],
  },
  {
    label: "Recycle Bin",
    path: "/trash",
    icon: Trash2,
    requiredRoles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
  },
  {
    label: "Logout",
    path: "/logout",
    icon: LogOut,
    type: "action",
  },
] as const satisfies readonly NavItem[];

export const canShowNavItem = (
  user: AuthUser | null | undefined,
  item: NavItem,
): boolean => {
  const hasRoleRule = Boolean(item.requiredRoles?.length);
  const hasPermissionRule = Boolean(item.requiredPermissions?.length);

  if (!hasRoleRule && !hasPermissionRule) {
    return true;
  }

  return (
    (hasRoleRule && hasAnyRole(user, item.requiredRoles ?? [])) ||
    (hasPermissionRule &&
      hasAnyPermission(user, item.requiredPermissions ?? []))
  );
};

export const getVisibleNavItems = (
  user: AuthUser | null | undefined,
): readonly NavItem[] => navItems.filter((item) => canShowNavItem(user, item));

export const getNavItemByPath = (pathname: string): NavItem | undefined =>
  navItems.find((item) => item.path === pathname);
