import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryErrorMessage,
} from './api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should successfully fetch categories', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: '1',
              name: 'HR Documents',
              description: 'Human Resources',
              document_count: 5,
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
        http.get(`${API_URL}/categories`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await getCategories({ page: 1, pageSize: 10 });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('HR Documents');
      expect(result.items[0].documentCount).toBe(5);
      expect(result.currentPage).toBe(1);
    });
  });

  describe('createCategory', () => {
    it('should successfully create a category', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '2',
          name: 'IT Policies',
          description: 'IT Department Policies',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.post(`${API_URL}/categories`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await createCategory({
        name: 'IT Policies',
        description: 'IT Department Policies',
        isActive: true,
      });

      expect(result.id).toBe('2');
      expect(result.name).toBe('IT Policies');
    });
  });

  describe('updateCategory', () => {
    it('should successfully update a category', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          name: 'Updated HR Docs',
          description: 'Updated HR',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.put(`${API_URL}/categories/:id`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await updateCategory({
        id: '1',
        values: { name: 'Updated HR Docs', description: 'Updated HR', isActive: true },
      });

      expect(result.name).toBe('Updated HR Docs');
    });
  });

  describe('deleteCategory', () => {
    it('should successfully delete a category', async () => {
      server.use(
        http.delete(`${API_URL}/categories/:id`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(deleteCategory('1')).resolves.toBeUndefined();
    });
  });

  describe('getCategoryErrorMessage', () => {
    it('should return error message from Error instance', () => {
      const error = new Error('Custom category error');
      expect(getCategoryErrorMessage(error)).toBe('Custom category error');
    });

    it('should return default fallback', () => {
      expect(getCategoryErrorMessage(null)).toBe('Category request failed.');
    });
  });
});
