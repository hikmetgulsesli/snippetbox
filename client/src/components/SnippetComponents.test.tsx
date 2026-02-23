import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnippetCard } from '../components/SnippetCard';
import { SnippetForm } from '../components/SnippetForm';
import { DeleteModal } from '../components/DeleteModal';
import type { Snippet, Collection, Tag } from '../types';

const mockSnippet: Snippet = {
  id: '1',
  title: 'Test Snippet',
  description: 'A test snippet',
  code: 'console.log("hello");\nconst x = 1;\nconst y = 2;\nconst z = 3;',
  language: 'javascript',
  collection_id: null,
  is_public: true,
  share_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: [
    { id: '1', name: 'test', color: '#FF0000', created_at: '2024-01-01T00:00:00Z' }
  ],
};

const mockCollections: Collection[] = [
  { id: '1', name: 'Test Collection', description: null, color: '#3B82F6', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

const mockTags: Tag[] = [
  { id: '1', name: 'test', color: '#FF0000', created_at: '2024-01-01T00:00:00Z' }
];

describe('SnippetCard', () => {
  it('renders snippet title and description', () => {
    render(<SnippetCard snippet={mockSnippet} />);
    
    expect(screen.getByText('Test Snippet')).toBeDefined();
    expect(screen.getByText('A test snippet')).toBeDefined();
  });

  it('renders language badge', () => {
    render(<SnippetCard snippet={mockSnippet} />);
    
    expect(screen.getByText('javascript')).toBeDefined();
  });

  it('renders public badge for public snippets', () => {
    render(<SnippetCard snippet={mockSnippet} />);
    
    expect(screen.getByText('Public')).toBeDefined();
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
    
    const editButton = screen.getByTitle('Edit snippet');
    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalledWith(mockSnippet);
  });

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn();
    render(<SnippetCard snippet={mockSnippet} onDelete={handleDelete} />);
    
    const deleteButton = screen.getByTitle('Delete snippet');
    fireEvent.click(deleteButton);
    expect(handleDelete).toHaveBeenCalledWith(mockSnippet);
  });

  it('shows copy button', () => {
    render(<SnippetCard snippet={mockSnippet} />);
    
    expect(screen.getByTitle('Copy to clipboard')).toBeDefined();
  });
});

describe('SnippetForm', () => {
  it('renders form with empty fields for new snippet', () => {
    render(
      <SnippetForm
        collections={mockCollections}
        tags={mockTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
          onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('New Snippet')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter snippet title...')).toBeDefined();
    expect(screen.getByPlaceholderText('Paste your code here...')).toBeDefined();
  });

  it('renders form with snippet data for editing', () => {
    render(
      <SnippetForm
        snippet={mockSnippet}
        collections={mockCollections}
        tags={mockTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
          onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('Edit Snippet')).toBeDefined();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(
      <SnippetForm
        collections={mockCollections}
        tags={mockTags}
        onSubmit={vi.fn()}
        onCancel={handleCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalled();
  });

  it('shows validation error for empty title', () => {
    render(
      <SnippetForm
        collections={mockCollections}
        tags={mockTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
          onClose={vi.fn()}
      />
    );
    
    const submitButton = screen.getByText('Create Snippet');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Title is required')).toBeDefined();
  });

  it('shows validation error for empty code', () => {
    render(
      <SnippetForm
        collections={mockCollections}
        tags={mockTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
          onClose={vi.fn()}
      />
    );
    
    const titleInput = screen.getByPlaceholderText('Enter snippet title...');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    const submitButton = screen.getByText('Create Snippet');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Code is required')).toBeDefined();
  });
});

describe('DeleteModal', () => {
  it('renders modal with title and message', () => {
    render(
      <DeleteModal
        title="Delete Snippet"
        message="Are you sure you want to delete this snippet?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
          onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('Delete Snippet')).toBeDefined();
    expect(screen.getByText('Are you sure you want to delete this snippet?')).toBeDefined();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(
      <DeleteModal
        title="Delete Snippet"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onClose={handleCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when delete button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <DeleteModal
        title="Delete Snippet"
        message="Are you sure?"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
          onClose={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('shows deleting state', () => {
    render(
      <DeleteModal
        title="Delete Snippet"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
          onClose={vi.fn()}
        isDeleting={true}
      />
    );
    
    expect(screen.getByText('Deleting...')).toBeDefined();
  });
});
