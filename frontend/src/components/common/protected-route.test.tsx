import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils';
import { ProtectedRoute } from './protected-route';
import { useAuthStore } from '@/store/auth-store';
import { Routes, Route, useLocation } from 'react-router-dom';

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => {
  const location = useLocation();
  return (
    <div>
      Login Page
      <span data-testid="from">{location.state?.from?.pathname}</span>
    </div>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
    });
  });

  it('should render loading state when not initialized', () => {
    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when initialized but not authenticated', () => {
    useAuthStore.setState({ isInitialized: true, isAuthenticated: false });

    render(
      <Routes>
        <Route path="/login" element={<LoginComponent />} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/protected' }
    );

    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('from')).toHaveTextContent('/protected');
  });

  it('should render children when initialized and authenticated', () => {
    useAuthStore.setState({ isInitialized: true, isAuthenticated: true });

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
