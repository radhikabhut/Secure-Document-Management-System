import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  assignUserRoles,
  deleteUser,
  getUserErrorMessage,
} from './api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should successfully fetch users', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: '1',
              full_name: 'Test User',
              email: 'test@example.com',
              role_id: 'ADMIN',
              role: 'ADMIN',
              is_active: true,
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
        http.get(`${API_URL}/users`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await getUsers({ page: 1, pageSize: 10 });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe('test@example.com');
      expect(result.currentPage).toBe(1);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('getUserById', () => {
    it('should successfully fetch a user by id', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          full_name: 'Test User',
          email: 'test@example.com',
          role_id: 'ADMIN',
          role: 'ADMIN',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.get(`${API_URL}/users/:id`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await getUserById('1');
      expect(result.id).toBe('1');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
    });
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '2',
          full_name: 'New User',
          email: 'new@example.com',
          role_id: 'EMPLOYEE',
          role: 'EMPLOYEE',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.post(`${API_URL}/users`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await createUser({
        fullName: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'EMPLOYEE',
      });

      expect(result.id).toBe('2');
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('updateUser', () => {
    it('should successfully update a user', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          full_name: 'Updated Name',
          email: 'test@example.com',
          role_id: 'ADMIN',
          role: 'ADMIN',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.put(`${API_URL}/users/:id`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await updateUser({
        id: '1',
        values: { firstName: 'Updated', lastName: 'Name', email: 'test@example.com' },
      });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('updateUserStatus', () => {
    it('should successfully update user status', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          full_name: 'Test User',
          email: 'test@example.com',
          role_id: 'ADMIN',
          role: 'ADMIN',
          is_active: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.put(`${API_URL}/users/:id`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await updateUserStatus({ id: '1', isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe('assignUserRoles', () => {
    it('should successfully assign user role', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          full_name: 'Test User',
          email: 'test@example.com',
          role_id: 'MANAGER',
          role: 'MANAGER',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.put(`${API_URL}/users/:id`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await assignUserRoles({ id: '1', values: { roleIds: ['MANAGER'] } });
      expect(result.roles[0].name).toBe('MANAGER');
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete a user', async () => {
      server.use(
        http.delete(`${API_URL}/users/:id`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(deleteUser('1')).resolves.toBeUndefined();
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return default error message for unknown errors', () => {
      expect(getUserErrorMessage(null)).toBe('User request failed.');
    });

    it('should return error message from Error instance', () => {
      const error = new Error('Custom error');
      expect(getUserErrorMessage(error)).toBe('Custom error');
    });
  });
});
