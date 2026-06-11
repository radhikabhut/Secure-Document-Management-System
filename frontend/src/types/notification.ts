export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  documentEventsEnabled: boolean;
  securityEventsEnabled: boolean;
}
