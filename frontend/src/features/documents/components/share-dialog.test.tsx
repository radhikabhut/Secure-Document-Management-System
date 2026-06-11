import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { ShareDialog } from './share-dialog';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('ShareDialog', () => {
  const mockDocument = {
    id: 'doc-1',
    title: 'Test Document',
    fileName: 'test.pdf',
    originalFileName: 'test.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    categoryId: 'cat-1',
    ownerId: 'user-1',
    status: 'APPROVED' as const,
    visibility: 'PRIVATE' as const,
    version: 1,
    tags: [],
    isEncrypted: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const defaultProps = {
    document: mockDocument,
    isOpen: true,
    isSharing: false,
    onClose: vi.fn(),
    onShare: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the share dialog correctly', async () => {
    server.use(
      http.get(`${API_URL}/users`, () => {
        return HttpResponse.json({
          success: true,
          data: { items: [], page: 1, page_size: 50, total_items: 0, total_pages: 1 }
        });
      }),
      http.get(`${API_URL}/departments`, () => {
        return HttpResponse.json({
          success: true,
          data: []
        });
      })
    );

    render(<ShareDialog {...defaultProps} />);
    
    expect(screen.getByText('Share document')).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });

  it('should show validation error if no recipient is selected', async () => {
    server.use(
      http.get(`${API_URL}/users`, () => {
        return HttpResponse.json({
          success: true,
          data: { items: [], page: 1, page_size: 50, total_items: 0, total_pages: 1 }
        });
      }),
      http.get(`${API_URL}/departments`, () => {
        return HttpResponse.json({
          success: true,
          data: []
        });
      })
    );

    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('No users available.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Share' }));

    // Validation schema requires at least one of userIds, roleIds, departments
    // It should display a root error or specific field error
    expect(await screen.findByText(/at least one user, role, or department/i)).toBeInTheDocument();
  });

  it('should successfully share a document', async () => {
    server.use(
      http.get(`${API_URL}/users`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            items: [{ id: 'user-2', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
            page: 1,
            page_size: 50,
            total_items: 1,
            total_pages: 1
          }
        });
      }),
      http.get(`${API_URL}/departments`, () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 'dept-1', name: 'IT' }]
        });
      })
    );

    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);

    // Wait for the user option to render
    const userCheckbox = await screen.findByDisplayValue('user-2');
    await user.click(userCheckbox);

    await user.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => {
      expect(defaultProps.onShare).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: ['user-2'],
          permissions: ['read']
        })
      );
    });
  });
});
