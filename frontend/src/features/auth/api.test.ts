import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import axios from 'axios';
import {
  loginRequest,
  registerRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  getAuthErrorMessage,
} from './api';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const mockBackendUser = {
  id: 'user-1',
  email: 'john.doe@example.com',
  full_name: 'John Doe',
  username: 'johndoe',
  is_active: true,
  role_id: 'role-1',
  role: 'User',
  last_login_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const expectedMappedUser = {
  id: 'user-1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: '2023-01-01T00:00:00Z',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  roles: [
    {
      id: 'role-1',
      name: 'User',
      description: 'User',
      permissions: [],
      isSystem: true,
    },
  ],
};

describe('Auth API', () => {
  describe('loginRequest', () => {
    it('should successfully log in and map the response', async () => {
      const payload = { email: 'john.doe@example.com', password: 'password123' };
      
      server.use(
        http.post(`${API_URL}/auth/login`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(payload);
          return HttpResponse.json({
            success: true,
            message: 'Login successful',
            data: {
              access_token: 'mock-jwt-token',
              token_type: 'Bearer',
              expires_at: '2023-01-01T01:00:00Z',
              user: mockBackendUser,
            },
          });
        })
      );

      const result = await loginRequest(payload);
      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        expiresAt: '2023-01-01T01:00:00Z',
        user: expectedMappedUser,
      });
    });
  });

  describe('registerRequest', () => {
    it('should successfully register and map the response', async () => {
      const payload = { fullName: 'Jane Smith', email: 'jane@example.com', password: 'password123', confirmPassword: 'password123' };
      
      server.use(
        http.post(`${API_URL}/auth/register`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            password: 'password123',
          });
          return HttpResponse.json({
            success: true,
            message: 'Registration successful',
            data: {
              user: {
                ...mockBackendUser,
                id: 'user-2',
                full_name: 'Jane Smith',
                email: 'jane@example.com',
                username: 'jane',
              },
            },
          });
        })
      );

      const result = await registerRequest(payload);
      expect(result.id).toBe('user-2');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });
  });

  describe('forgotPasswordRequest', () => {
    it('should successfully request password reset', async () => {
      server.use(
        http.post(`${API_URL}/auth/forgot-password`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ email: 'test@example.com' });
          return HttpResponse.json({ success: true, message: 'Email sent' });
        })
      );

      await expect(forgotPasswordRequest({ email: ' test@example.com ' })).resolves.toBeUndefined();
    });
  });

  describe('resetPasswordRequest', () => {
    it('should successfully reset password', async () => {
      server.use(
        http.post(`${API_URL}/auth/reset-password`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ token: 'reset-token', new_password: 'newpassword123' });
          return HttpResponse.json({ success: true, message: 'Password reset' });
        })
      );

      await expect(resetPasswordRequest({ 
        token: 'reset-token', 
        values: { password: 'newpassword123', confirmPassword: 'newpassword123' } 
      })).resolves.toBeUndefined();
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should handle 429 Too Many Requests', () => {
      const error = new axios.AxiosError('Too Many Requests', '429', undefined, undefined, {
        status: 429,
        data: {},
      } as any);
      expect(getAuthErrorMessage(error)).toBe('Too many attempts. Please wait a moment and try again.');
    });

    it('should handle response message', () => {
      const error = new axios.AxiosError('Bad Request', '400', undefined, undefined, {
        status: 400,
        data: { message: 'Invalid credentials' },
      } as any);
      expect(getAuthErrorMessage(error)).toBe('Invalid credentials');
    });

    it('should handle field errors array', () => {
      const error = new axios.AxiosError('Bad Request', '400', undefined, undefined, {
        status: 400,
        data: { errors: [{ message: 'Email is required' }] },
      } as any);
      expect(getAuthErrorMessage(error)).toBe('Email is required');
    });

    it('should fallback to standard error message', () => {
      const error = new Error('Network Error');
      expect(getAuthErrorMessage(error)).toBe('Network Error');
    });

    it('should fallback to generic message for unknown errors', () => {
      expect(getAuthErrorMessage(null)).toBe('Something went wrong. Please try again.');
    });
  });
});
