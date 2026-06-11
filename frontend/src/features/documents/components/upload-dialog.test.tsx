import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { UploadDialog } from './upload-dialog';
import { server } from '@/test/mocks/server';
import { http, HttpResponse, delay } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('UploadDialog', () => {
  const defaultProps = {
    categories: [{ id: 'cat-1', name: 'HR Documents' }],
    isOpen: true,
    onClose: vi.fn(),
    onUploaded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the upload form correctly', () => {
    render(<UploadDialog {...defaultProps} />);
    
    expect(screen.getByText('Upload document')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
  });

  it('should show validation error when title is empty', async () => {
    const user = userEvent.setup();
    render(<UploadDialog {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Title must be at least 2 characters long')).toBeInTheDocument();
  });

  it('should display error when API call fails', async () => {
    server.use(
      http.post(`${API_URL}/documents/upload`, () => {
        return HttpResponse.json(
          { message: 'Upload failed' },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    render(<UploadDialog {...defaultProps} />);
    
    // Fill out form
    await user.type(screen.getByLabelText('Title'), 'Test Document');
    
    // Mock file drop using a simplified approach
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    
    await user.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('should successfully upload a file and call callbacks', async () => {
    server.use(
      http.post(`${API_URL}/documents/upload`, async () => {
        await delay(50);
        return HttpResponse.json({
          success: true,
          data: { id: 'doc-1' }
        });
      })
    );

    const user = userEvent.setup();
    render(<UploadDialog {...defaultProps} />);
    
    // Fill out form
    await user.type(screen.getByLabelText('Title'), 'My Secure File');
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await user.click(screen.getByRole('button', { name: 'Upload' }));

    expect(screen.getByRole('button', { name: 'Uploading...' })).toBeDisabled();

    await waitFor(() => {
      expect(defaultProps.onUploaded).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
