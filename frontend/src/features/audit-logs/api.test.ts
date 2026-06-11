import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAuditLogs,
  getAuditLogErrorMessage,
} from './api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Audit Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should successfully fetch audit logs', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'log-1',
              action: 'DOCUMENT_UPLOAD',
              entity_type: 'DOCUMENT',
              entity_id: 'doc-1',
              user_id: 'user-1',
              ip_address: '192.168.1.1',
              user_agent: 'Mozilla/5.0',
              metadata: { size: 1024 },
              created_at: '2025-01-01T00:00:00Z',
            },
          ],
          page: 1,
          page_size: 10,
          total_items: 1,
          total_pages: 1,
        },
      };

      server.use(
        http.get(`${API_URL}/audit-logs`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await getAuditLogs({ page: 1, pageSize: 10 });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].action).toBe('DOCUMENT_UPLOAD');
      expect(result.items[0].entityType).toBe('DOCUMENT');
      expect(result.currentPage).toBe(1);
    });
  });

  describe('getAuditLogErrorMessage', () => {
    it('should return error message from Error instance', () => {
      const error = new Error('Custom audit log error');
      expect(getAuditLogErrorMessage(error)).toBe('Custom audit log error');
    });

    it('should return default fallback', () => {
      expect(getAuditLogErrorMessage(null)).toBe('Unable to load audit logs.');
    });
  });
});
