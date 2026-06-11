import type { User } from './auth';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'SHARE'
  | 'PERMISSION_CHANGE';

export type AuditEntityType =
  | 'USER'
  | 'ROLE'
  | 'DOCUMENT'
  | 'CATEGORY'
  | 'NOTIFICATION'
  | 'SYSTEM';

export interface AuditLog {
  id: string;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId?: string;
  actorId?: string;
  actor?: User;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: AuditAction | string;
  entityType?: AuditEntityType | string;
  actorId?: string;
  from?: string;
  to?: string;
}
