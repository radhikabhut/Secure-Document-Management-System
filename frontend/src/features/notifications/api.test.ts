import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationErrorMessage,
} from './api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should successfully fetch notifications and count unread', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'notif-1',
              user_id: 'user-1',
              type: 'SYSTEM_ALERT',
              subject: 'System Maintenance',
              message: 'Maintenance scheduled',
              is_read: false,
              created_at: '2025-01-01T00:00:00Z',
            },
            {
              id: 'notif-2',
              user_id: 'user-1',
              type: 'DOCUMENT_SHARE',
              subject: 'Document Shared',
              message: 'A document was shared with you',
              is_read: true,
              read_at: '2025-01-02T00:00:00Z',
              created_at: '2025-01-01T00:00:00Z',
            },
          ],
          page: 1,
          page_size: 10,
          total_items: 2,
          total_pages: 1,
        },
      };

      server.use(
        http.get(`${API_URL}/notifications`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await getNotifications({ page: 1, pageSize: 10 });
      
      expect(result.items).toHaveLength(2);
      expect(result.items[0].title).toBe('System Maintenance');
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should successfully mark a notification as read', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'notif-1',
          user_id: 'user-1',
          type: 'SYSTEM_ALERT',
          subject: 'System Maintenance',
          message: 'Maintenance scheduled',
          is_read: true,
          read_at: '2025-01-02T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.patch(`${API_URL}/notifications/:id/read`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await markNotificationAsRead('notif-1');
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should resolve successfully since it is mocked locally', async () => {
      await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
    });
  });

  describe('getNotificationErrorMessage', () => {
    it('should return error message from Error instance', () => {
      const error = new Error('Custom notification error');
      expect(getNotificationErrorMessage(error)).toBe('Custom notification error');
    });

    it('should return default fallback', () => {
      expect(getNotificationErrorMessage(null)).toBe('Notification request failed.');
    });
  });
});
