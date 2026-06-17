import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
  hardDeleteDocument,
  restoreDocument,
  shareDocument,
  getDocumentErrorMessage,
} from './api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDocuments', () => {
    it('should fetch a list of documents successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'doc-1',
              title: 'Test Doc',
              original_filename: 'test.pdf',
              mime_type: 'application/pdf',
              file_size: 1024,
              category_id: 'cat-1',
              uploaded_by: 'user-1',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
          ],
          page: 1,
          page_size: 10,
          total_items: 1,
          total_pages: 1,
        },
      };

      server.use(
        http.get(`${API_URL}/documents`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await getDocuments({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Doc');
      expect(result.currentPage).toBe(1);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('getDocumentById', () => {
    it('should fetch document details, permissions, and audit logs', async () => {
      const mockDocResponse = {
        success: true,
        data: {
          id: 'doc-1',
          title: 'Detailed Doc',
          original_filename: 'detailed.pdf',
          mime_type: 'application/pdf',
        },
      };

      const mockPermsResponse = {
        success: true,
        data: [
          { id: 'perm-1', user_id: 'user-2', permission_type: 'VIEW', created_at: '2025-01-01T00:00:00Z' },
          { id: 'perm-2', user_id: 'user-2', permission_type: 'EDIT', created_at: '2025-01-01T00:00:00Z' },
        ],
      };

      const mockAuditLogsResponse = {
        success: true,
        data: {
          items: [
            { id: 'log-1', action: 'CREATE', entity_type: 'DOCUMENT', entity_id: 'doc-1' },
          ],
        },
      };

      server.use(
        http.get(`${API_URL}/documents/:id`, () => {
          return HttpResponse.json(mockDocResponse);
        }),
        http.get(`${API_URL}/documents/:id/permissions`, () => {
          return HttpResponse.json(mockPermsResponse);
        }),
        http.get(`${API_URL}/audit-logs`, () => {
          return HttpResponse.json(mockAuditLogsResponse);
        })
      );

      const result = await getDocumentById('doc-1');

      expect(result.id).toBe('doc-1');
      expect(result.title).toBe('Detailed Doc');
      expect(result.permissions).toHaveLength(1); // Grouped by user_id
      expect(result.permissions![0].permissions).toEqual(['VIEW', 'EDIT']);
      expect(result.auditLogs).toHaveLength(1);
      expect(result.auditLogs![0].action).toBe('CREATE');
    });
  });

  describe('uploadDocument', () => {
    it('should successfully upload a document', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'doc-new',
          title: 'New Upload',
        },
      };

      server.use(
        http.post(`${API_URL}/documents/upload`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = await uploadDocument({
        file,
        title: 'New Upload',
        categoryId: 'cat-1',
        description: 'Test Desc',
      });

      expect(result.id).toBe('doc-new');
      expect(result.title).toBe('New Upload');
    });
  });

  describe('deleteDocument', () => {
    it('should softly delete a document', async () => {
      server.use(
        http.delete(`${API_URL}/documents/:id`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(deleteDocument('doc-1')).resolves.toBeUndefined();
    });
  });

  describe('hardDeleteDocument', () => {
    it('should permanently delete a document', async () => {
      server.use(
        http.delete(`${API_URL}/documents/:id/hard`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(hardDeleteDocument('doc-1')).resolves.toBeUndefined();
    });
  });

  describe('restoreDocument', () => {
    it('should restore a soft-deleted document', async () => {
      server.use(
        http.post(`${API_URL}/documents/:id/restore`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(restoreDocument('doc-1')).resolves.toBeUndefined();
    });
  });

  describe('shareDocument', () => {
    it('should grant multiple permissions via multiple requests', async () => {
      let callCount = 0;
      server.use(
        http.post(`${API_URL}/permissions/grant`, () => {
          callCount++;
          return HttpResponse.json({ success: true });
        })
      );

      await shareDocument('doc-1', {
        userIds: ['user-2'],
        roleIds: [],
        departments: [],
        permissions: ['read', 'download'],
      });

      expect(callCount).toBe(2);
    });
  });

  describe('getDocumentErrorMessage', () => {
    it('should return error message from Error instance', () => {
      const error = new Error('Custom document error');
      expect(getDocumentErrorMessage(error)).toBe('Custom document error');
    });

    it('should return default fallback', () => {
      expect(getDocumentErrorMessage(null)).toBe('Document request failed.');
    });
  });
});
