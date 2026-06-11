import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { CategoryFormDialog } from './category-form-dialog';

describe('CategoryFormDialog', () => {
  const defaultProps = {
    categories: [],
    isOpen: true,
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the add category form correctly', () => {
    render(<CategoryFormDialog {...defaultProps} />);
    
    expect(screen.getByText('Add category')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Parent category')).toBeInTheDocument();
  });

  it('should show validation error on empty submission', async () => {
    const user = userEvent.setup();
    render(<CategoryFormDialog {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name must be at least 2 characters long')).toBeInTheDocument();
  });

  it('should successfully submit valid category data', async () => {
    const user = userEvent.setup();
    render(<CategoryFormDialog {...defaultProps} />);
    
    await user.type(screen.getByLabelText('Name'), 'HR Documents');
    await user.type(screen.getByLabelText('Description'), 'All HR related files');
    
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'HR Documents',
          description: 'All HR related files',
          isActive: true,
        })
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('should populate fields when editing an existing category', () => {
    render(
      <CategoryFormDialog
        {...defaultProps}
        category={{
          id: 'cat-1',
          name: 'IT Policies',
          description: 'IT Department Policies',
          isActive: false,
          documentCount: 0,
          createdAt: '',
          updatedAt: '',
        }}
      />
    );
    
    expect(screen.getByText('Edit category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('IT Policies')).toBeInTheDocument();
    expect(screen.getByDisplayValue('IT Department Policies')).toBeInTheDocument();
    expect(screen.getByLabelText('Active')).not.toBeChecked();
  });
});
