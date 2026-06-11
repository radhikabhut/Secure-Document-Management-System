import type { Role, User } from '@/types/auth';
import type { Document } from '@/types/document';

export const PERMISSIONS = {
  usersRead: 'users:read',
  usersManage: 'users:manage',
  rolesManage: 'roles:manage',
  documentsRead: 'documents:read',
  documentsCreate: 'documents:create',
  documentsUpdate: 'documents:update',
  documentsDelete: 'documents:delete',
  documentsApprove: 'documents:approve',
  documentsDownload: 'documents:download',
  documentsShare: 'documents:share',
  categoriesManage: 'categories:manage',
  auditLogsRead: 'audit-logs:read',
  notificationsManage: 'notifications:manage',
  systemManage: 'system:manage',
} as const;

export const ROLE_LEVELS: Record<string, number> = {
  VIEWER: 10,
  EMPLOYEE: 20,
  MANAGER: 50,
  ADMIN: 80,
  SUPER_ADMIN: 100,
};

const WILDCARD_PERMISSION = '*';

export const normalizeRoleName = (role: Role | string): string =>
  (typeof role === 'string' ? role : role.name).trim().toUpperCase();

export const getUserRoles = (user?: User | null): Role[] => user?.roles ?? [];

export const getUserRoleNames = (user?: User | null): string[] =>
  getUserRoles(user).map(normalizeRoleName);

export const getHighestRoleLevel = (user?: User | null): number =>
  getUserRoleNames(user).reduce((highestLevel, roleName) => {
    const roleLevel = ROLE_LEVELS[roleName] ?? 0;

    return Math.max(highestLevel, roleLevel);
  }, 0);

export const hasRole = (user: User | null | undefined, roleName: string): boolean => {
  const normalizedRoleName = roleName.trim().toUpperCase();

  return getUserRoleNames(user).includes(normalizedRoleName);
};

export const hasAnyRole = (user: User | null | undefined, roleNames: string[]): boolean =>
  roleNames.some((roleName) => hasRole(user, roleName));

export const hasAllRoles = (user: User | null | undefined, roleNames: string[]): boolean =>
  roleNames.every((roleName) => hasRole(user, roleName));

export const hasMinimumRole = (user: User | null | undefined, roleName: string): boolean => {
  const requiredLevel = ROLE_LEVELS[roleName.trim().toUpperCase()] ?? Number.POSITIVE_INFINITY;

  return getHighestRoleLevel(user) >= requiredLevel;
};

export const getUserPermissions = (user?: User | null): string[] => {
  const permissions = new Set<string>();

  for (const role of getUserRoles(user)) {
    for (const permission of role.permissions) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
};

export const hasPermission = (
  user: User | null | undefined,
  permission: string,
): boolean => {
  const permissions = getUserPermissions(user);

  return permissions.includes(WILDCARD_PERMISSION) || permissions.includes(permission);
};

export const hasAnyPermission = (
  user: User | null | undefined,
  permissions: string[],
): boolean => permissions.some((permission) => hasPermission(user, permission));

export const hasAllPermissions = (
  user: User | null | undefined,
  permissions: string[],
): boolean => permissions.every((permission) => hasPermission(user, permission));

export const canManageUsers = (user?: User | null): boolean =>
  hasMinimumRole(user, 'ADMIN') || hasPermission(user, PERMISSIONS.usersManage);

export const canManageRoles = (user?: User | null): boolean =>
  hasMinimumRole(user, 'ADMIN') || hasPermission(user, PERMISSIONS.rolesManage);

export const canManageCategories = (user?: User | null): boolean =>
  hasMinimumRole(user, 'MANAGER') || hasPermission(user, PERMISSIONS.categoriesManage);

export const canViewAuditLogs = (user?: User | null): boolean =>
  hasMinimumRole(user, 'MANAGER') || hasPermission(user, PERMISSIONS.auditLogsRead);

export const canCreateDocument = (user?: User | null): boolean =>
  hasMinimumRole(user, 'EMPLOYEE') || hasPermission(user, PERMISSIONS.documentsCreate);

export const canReadDocument = (
  user: User | null | undefined,
  document?: Pick<Document, 'ownerId' | 'visibility'> | null,
): boolean => {
  if (!document) {
    return hasPermission(user, PERMISSIONS.documentsRead);
  }

  if (document.visibility === 'PUBLIC') {
    return true;
  }

  return (
    hasMinimumRole(user, 'MANAGER') ||
    hasPermission(user, PERMISSIONS.documentsRead) ||
    Boolean(user?.id && user.id === document.ownerId)
  );
};

export const canUpdateDocument = (
  user: User | null | undefined,
  document?: Pick<Document, 'ownerId'> | null,
): boolean =>
  hasMinimumRole(user, 'MANAGER') ||
  hasPermission(user, PERMISSIONS.documentsUpdate) ||
  Boolean(document?.ownerId && user?.id === document.ownerId);

export const canDeleteDocument = (
  user: User | null | undefined,
  document?: Pick<Document, 'ownerId'> | null,
): boolean =>
  hasMinimumRole(user, 'ADMIN') ||
  hasPermission(user, PERMISSIONS.documentsDelete) ||
  Boolean(document?.ownerId && user?.id === document.ownerId);

export const canApproveDocument = (user?: User | null): boolean =>
  hasMinimumRole(user, 'MANAGER') || hasPermission(user, PERMISSIONS.documentsApprove);

export const canDownloadDocument = (user?: User | null): boolean =>
  hasMinimumRole(user, 'VIEWER') || hasPermission(user, PERMISSIONS.documentsDownload);

export const canShareDocument = (
  user: User | null | undefined,
  document?: Pick<Document, 'ownerId'> | null,
): boolean =>
  hasMinimumRole(user, 'MANAGER') ||
  hasPermission(user, PERMISSIONS.documentsShare) ||
  Boolean(document?.ownerId && user?.id === document.ownerId && hasMinimumRole(user, 'EMPLOYEE'));

export const getDefaultRoute = (user: User | null | undefined): string =>
  hasMinimumRole(user, 'MANAGER') ? '/dashboard' : '/documents';
