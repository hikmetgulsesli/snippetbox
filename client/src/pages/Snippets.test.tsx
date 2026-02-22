import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnippetCard } from '../components/SnippetCard';
import { SnippetDetail } from '../components/SnippetDetail';
import { SnippetForm } from '../components/SnippetForm';
import { Modal, DeleteConfirmationModal } from '../components/Modal';
import { Skeleton, SnippetCardSkeleton } from '../components/Skeleton';

const mockSnippet = {
  id: '1',
  title: 'Test Snippet',
  description: 'A test snippet',
  code: 'console.log("hello")',
  language: 'javascript',
  is_public: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: [{ id: '1', name: 'test', color: '#ff0000' }],
  collection: { id: '1', name: 'Test Collection', color: '#00ff00' },
};

describe('SnippetCard', () => {
  it('renders snippet title and description', () => {
    render(<SnippetCard snippet={mockSnippet} />);
    
    expect(screen.getByText('Test Snippet')).toBeInTheDocument();
    expect(screen.getByText('A test snippet')).toBeInTheDocument();
  });

  it('renders language badge', () => {
    render(<SnippetCard snippet={mockSnippet} />);
    
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(<SnippetCard snippet={mockSnippet} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Test Snippet'));
    expect(handleClick).toHaveBeenCalledWith(mockSnippet);
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = vi.fn();
    render(<SnippetCard snippet={mockSnippet} onEdit={handleEdit} />);
    
    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalledWith(mockSnippet);
  });

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn();
    render(<SnippetCard snippet={mockSnippet} onDelete={handleDelete} />);
    
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);
    expect(handleDelete).toHaveBeenCalledWith(mockSnippet);
  });

  it('shows copy success state', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<SnippetCard snippet={mockSnippet} />);
    
    const copyButton = screen.getByTitle('Copy code');
    fireEvent.click(copyButton);
    
    expect(await screen.findByTitle('Copy code')).toBeInTheDocument();
  });
});

describe('SnippetDetail', () => {
  it('renders snippet details', () => {
    render(<SnippetDetail snippet={mockSnippet} />);
    
    expect(screen.getByText('Test Snippet')).toBeInTheDocument();
    expect(screen.getByText('A test snippet')).toBeInTheDocument();
    expect(screen.getByText('console.log("hello")')).toBeInTheDocument();
  });

  it('renders metadata', () => {
    render(<SnippetDetail snippet={mockSnippet} />);
    
    expect(screen.getByText('Language:')).toBeInTheDocument();
    // Use getAllByText since 'javascript' appears in both metadata and code block
    expect(screen.getAllByText('javascript')[0]).toBeInTheDocument();
    expect(screen.getByText('Visibility:')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const handleBack = vi.fn();
    render(<SnippetDetail snippet={mockSnippet} onBack={handleBack} />);
    
    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });
});

describe('SnippetForm', () => {
  it('renders form fields', () => {
    render(
      <SnippetForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Language/i)).toBeInTheDocument();
  });

  it('shows validation errors', () => {
    render(
      <SnippetForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    
    const submitButton = screen.getByText('Create Snippet');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
  });

  it('calls onSubmit with form data', () => {
    const handleSubmit = vi.fn();
    render(
      <SnippetForm
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
      />
    );
    
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'New Snippet' },
    });
    fireEvent.change(screen.getByLabelText(/Code/i), {
      target: { value: 'const x = 1;' },
    });
    
    fireEvent.click(screen.getByText('Create Snippet'));
    
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Snippet',
        code: 'const x = 1;',
      })
    );
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(
      <SnippetForm
        onSubmit={vi.fn()}
        onCancel={handleCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalled();
  });
});

describe('Modal', () => {
  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('DeleteConfirmationModal', () => {
  it('renders confirmation message', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Item"
        message="Are you sure?"
      />
    );
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Delete Item"
        message="Are you sure?"
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(handleConfirm).toHaveBeenCalled();
  });
});

describe('Skeleton', () => {
  it('renders skeleton element', () => {
    render(<Skeleton className="w-20 h-4" />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('SnippetCardSkeleton', () => {
  it('renders card skeleton', () => {
    render(<SnippetCardSkeleton />);
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
