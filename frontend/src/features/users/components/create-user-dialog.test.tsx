import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { CreateUserDialog } from './create-user-dialog';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('CreateUserDialog', () => {
  const defaultProps = {
    isOpen: true,
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get(`${API_URL}/departments`, () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 'dept-1', name: 'IT' }]
        });
      })
    );
  });

  it('should render the form correctly', () => {
    render(<CreateUserDialog {...defaultProps} />);
    
    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument();
  });

  it('should show validation errors on empty submission', async () => {
    const user = userEvent.setup();
    render(<CreateUserDialog {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    expect(await screen.findByText('Full name must be at least 2 characters long')).toBeInTheDocument();
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 8 characters long')).toBeInTheDocument();
  });

  it('should successfully submit valid user data', async () => {
    const user = userEvent.setup();
    render(<CreateUserDialog {...defaultProps} />);
    
    await user.type(screen.getByLabelText('Full name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        })
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
