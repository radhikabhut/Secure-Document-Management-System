import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils';
import { RoleGuard } from './role-guard';
import { useAuthStore } from '@/store/auth-store';
import { Routes, Route } from 'react-router-dom';
import * as permissions from '@/lib/permissions';

// Mock permissions to isolate testing
vi.mock('@/lib/permissions', () => ({
  hasAnyRole: vi.fn(),
  getDefaultRoute: vi.fn(),
}));

const ProtectedContent = () => <div>Role specific content</div>;
const UnauthorizedFallback = () => <div>Unauthorized</div>;
const DefaultRouteFallback = () => <div>Default Dashboard</div>;

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com' } as any,
    });
  });

  it('should render children when allowedRoles is empty', () => {
    render(
      <RoleGuard allowedRoles={[]}>
        <ProtectedContent />
      </RoleGuard>
    );

    expect(screen.getByText('Role specific content')).toBeInTheDocument();
  });

  it('should render children when user has required role', () => {
    vi.mocked(permissions.hasAnyRole).mockReturnValue(true);

    render(
      <RoleGuard allowedRoles={['Admin']}>
        <ProtectedContent />
      </RoleGuard>
    );

    expect(screen.getByText('Role specific content')).toBeInTheDocument();
    expect(permissions.hasAnyRole).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
      ['Admin']
    );
  });

  it('should redirect to fallbackPath when user lacks required role', () => {
    vi.mocked(permissions.hasAnyRole).mockReturnValue(false);

    render(
      <Routes>
        <Route path="/unauthorized" element={<UnauthorizedFallback />} />
        <Route
          path="/protected"
          element={
            <RoleGuard allowedRoles={['Admin']} fallbackPath="/unauthorized">
              <ProtectedContent />
            </RoleGuard>
          }
        />
      </Routes>,
      { route: '/protected' }
    );

    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.queryByText('Role specific content')).not.toBeInTheDocument();
  });

  it('should redirect to default route when user lacks required role and no fallback provided', () => {
    vi.mocked(permissions.hasAnyRole).mockReturnValue(false);
    vi.mocked(permissions.getDefaultRoute).mockReturnValue('/dashboard');

    render(
      <Routes>
        <Route path="/dashboard" element={<DefaultRouteFallback />} />
        <Route
          path="/protected"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <ProtectedContent />
            </RoleGuard>
          }
        />
      </Routes>,
      { route: '/protected' }
    );

    expect(screen.getByText('Default Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Role specific content')).not.toBeInTheDocument();
  });
});
