import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Tag, X } from 'lucide-react';
import { SnippetCard } from '../components/SnippetCard';
import { SnippetDetail } from '../components/SnippetDetail';
import { SnippetForm } from '../components/SnippetForm';
import { DeleteModal } from '../components/DeleteModal';
import { SnippetListSkeleton } from '../components/Skeletons';
import { TagFilter } from '../components/TagCloud';
import { useToast } from '../contexts/ToastContext';
import type { Snippet, SnippetInput, Collection, Tag as TagType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

async function fetchSnippets(filters?: { search?: string; tag?: string; tags?: string }): Promise<{ data: Snippet[]; meta: { total: number } }> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tag) params.append('tag', filters.tag);
  if (filters?.tags) params.append('tags', filters.tags);
  
  const url = `${API_URL}/api/snippets${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch snippets');
  return response.json();
}

async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_URL}/api/collections`);
  if (!response.ok) throw new Error('Failed to fetch collections');
  return response.json();
}

async function fetchTags(): Promise<TagType[]> {
  const response = await fetch(`${API_URL}/api/tags`);
  if (!response.ok) throw new Error('Failed to fetch tags');
  return response.json();
}

async function createSnippet(data: SnippetInput): Promise<Snippet> {
  const response = await fetch(`${API_URL}/api/snippets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create snippet');
  return response.json();
}

async function updateSnippet(id: string, data: SnippetInput): Promise<Snippet> {
  const response = await fetch(`${API_URL}/api/snippets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update snippet');
  return response.json();
}

async function deleteSnippet(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/snippets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete snippet');
}

interface SnippetsProps {
  searchOpen?: boolean;
  onSearchClose?: () => void;
}

export function Snippets({ searchOpen = false, onSearchClose }: SnippetsProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<Snippet | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Handle search open from keyboard shortcut
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      onSearchClose?.();
    }
  }, [searchOpen, onSearchClose]);

  // Build query params for fetching
  const queryParams: { search?: string; tags?: string } = {};
  if (searchQuery) queryParams.search = searchQuery;
  if (selectedTags.length > 0) queryParams.tags = selectedTags.join(',');

  const { data: snippetsData, isLoading: isLoadingSnippets } = useQuery(
    ['snippets', queryParams],
    () => fetchSnippets(queryParams)
  );
  
  const { data: collections, isLoading: isLoadingCollections } = useQuery('collections', fetchCollections);
  const { data: tags, isLoading: isLoadingTags } = useQuery('tags', fetchTags);

  const createMutation = useMutation(createSnippet, {
    onSuccess: () => {
      queryClient.invalidateQueries('snippets');
      setIsCreating(false);
      showToast('Snippet created successfully', 'success');
    },
    onError: () => {
      showToast('Failed to create snippet', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: SnippetInput }) => updateSnippet(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('snippets');
        setEditingSnippet(null);
        setSelectedSnippet(null);
        showToast('Snippet updated successfully', 'success');
      },
      onError: () => {
        showToast('Failed to update snippet', 'error');
      },
    }
  );

  const deleteMutation = useMutation(deleteSnippet, {
    onSuccess: () => {
      queryClient.invalidateQueries('snippets');
      setDeletingSnippet(null);
      setSelectedSnippet(null);
      showToast('Snippet deleted successfully', 'success');
    },
    onError: () => {
      showToast('Failed to delete snippet', 'error');
    },
  });

  const isLoading = isLoadingSnippets || isLoadingCollections || isLoadingTags;
  const snippets = snippetsData?.data || [];

  const handleCreate = (data: SnippetInput) => {
    
    createMutation.mutate(data);
  };

  const handleUpdate = (data: SnippetInput) => {
    
    if (editingSnippet) {
      updateMutation.mutate({ id: editingSnippet.id, data });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(deletingSnippet!.id);
  };

  const handleTagFilterChange = (tagIds: string[]) => {
    setSelectedTags(tagIds);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0;

  // Show detail view
  if (selectedSnippet) {
    return (
      <SnippetDetail
        snippet={selectedSnippet}
        onClose={() => setSelectedSnippet(null)}
        onEdit={setEditingSnippet}
        onDelete={setDeletingSnippet}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Snippets</h1>
          <p className="text-[var(--text-muted)] mt-1">
            {snippetsData?.meta.total || 0} code snippets
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search snippets... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]
            ${
            showFilters || hasActiveFilters
              ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50'
              : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <Tag className="w-4 h-4" />
          Tags
          {selectedTags.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--primary)] text-[var(--surface)]">
              {selectedTags.length}
            </span>
          )}
        </button>
      </div>

      {/* Tag Filters Panel */}
      {showFilters && tags && tags.length > 0 && (
        <div className="p-4 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)]">
          <TagFilter
            tags={tags}
            selectedTags={selectedTags}
            onTagsChange={handleTagFilterChange}
          />
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[var(--text-muted)]">Active filters:</span>
          {searchQuery && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface-alt)] text-[var(--text-muted)] text-sm">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')} className="hover:text-[var(--text)] cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTags.map(tagId => {
            const tag = tags?.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
                onClick={() => handleTagFilterChange(selectedTags.filter(id => id !== tagId))}
              >
                {tag.name}
                <X className="w-3 h-3" />
              </span>
            );
          })}
          <button
            onClick={clearFilters}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Snippets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SnippetListSkeleton key={i} />
          ))}
        </div>
      ) : snippets.length > 0 ? (
        <div className="grid gap-4">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onClick={setSelectedSnippet}
              onEdit={setEditingSnippet}
              onDelete={setDeletingSnippet}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">
            {hasActiveFilters
              ? 'No snippets match your filters'
              : 'No snippets yet. Create your first one!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <SnippetForm
          snippet={undefined}
          collections={collections || []}
          tags={tags || []}
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createMutation.isLoading}
        />
      )}

      {/* Edit Modal */}
      {editingSnippet && (
        <SnippetForm
          snippet={editingSnippet}
          collections={collections || []}
          tags={tags || []}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSnippet(null)}
          isSubmitting={updateMutation.isLoading}
        />
      )}

      {/* Delete Confirmation */}
      {deletingSnippet && (
        <DeleteModal
          onClose={() => setDeletingSnippet(null)}
          onConfirm={handleDelete}
          title="Delete Snippet"
          message={`Are you sure you want to delete "${deletingSnippet.title}"? This action cannot be undone.`}
          isDeleting={deleteMutation.isLoading}
        />
      )}
    </div>
  );
}
