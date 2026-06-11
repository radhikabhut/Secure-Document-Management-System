import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { LoginForm } from './login-form';
import { server } from '@/test/mocks/server';
import { http, HttpResponse, delay } from 'msw';
import { useAuthStore } from '@/store/auth-store';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('should render the login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors on empty submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  it('should show error message on API failure', async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, () => {
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/Email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    // Wait for the root error message to be displayed
    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  it('should successfully log in and navigate', async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, async () => {
        await delay(50);
        return HttpResponse.json({
          success: true,
          message: 'Login successful',
          data: {
            access_token: 'test-token',
            token_type: 'Bearer',
            expires_at: '2025-01-01T00:00:00Z',
            user: {
              id: '1',
              email: 'test@example.com',
              full_name: 'Test User',
              is_active: true,
              role_id: 'admin-role',
              role: 'Admin'
            },
          },
        });
      })
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    // Verify loading state on button
    expect(screen.getByRole('button', { name: /Signing in.../i })).toBeDisabled();

    // Verify navigation was called after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
    
    // Verify Zustand store was updated
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
  });
});
