import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth-store';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
    });
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialized).toBe(false);
  });

  it('should successfully log in, set user and token, and update isAuthenticated', async () => {
    const mockBackendUser = {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      role_id: 'role-1',
      role: 'User',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    server.use(
      http.post(`${API_URL}/auth/login`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Login successful',
          data: {
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_at: '2023-01-02',
            user: mockBackendUser,
          },
        });
      })
    );

    const user = await useAuthStore.getState().login({ email: 'test@example.com', password: 'password123' });
    
    expect(user.id).toBe('user-1');
    expect(user.firstName).toBe('Test');
    
    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitialized).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('should clear state on logout', () => {
    // Set an initial authenticated state
    useAuthStore.setState({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      token: 'test-token',
      isAuthenticated: true,
      isInitialized: true,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set auth session manually', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' } as any;
    
    useAuthStore.getState().setAuthSession({
      user: mockUser,
      accessToken: 'session-token',
      tokenType: 'Bearer',
      expiresAt: '2023-01-02',
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('session-token');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitialized).toBe(true);
  });

  it('should set user manually', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' } as any;
    
    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
  });
});
