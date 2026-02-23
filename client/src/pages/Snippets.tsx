import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Tag, X } from 'lucide-react';
import { SnippetCard } from '../components/SnippetCard';
import { SnippetDetail } from '../components/SnippetDetail';
import { SnippetForm } from '../components/SnippetForm';
import { DeleteModal } from '../components/DeleteModal';
import { SnippetListSkeleton } from '../components/Skeletons';
import { TagFilter } from '../components/TagCloud';
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

export function Snippets() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<Snippet | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: SnippetInput }) => updateSnippet(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('snippets');
        setEditingSnippet(null);
        setSelectedSnippet(null);
      },
    }
  );

  const deleteMutation = useMutation(deleteSnippet, {
    onSuccess: () => {
      queryClient.invalidateQueries('snippets');
      setDeletingSnippet(null);
      setSelectedSnippet(null);
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
    if (deletingSnippet) {
      deleteMutation.mutate(deletingSnippet.id);
    }
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
          <h1 className="text-2xl font-bold text-surface-100">Snippets</h1>
          <p className="text-surface-400 mt-1">
            {snippetsData?.meta.total || 0} code snippets
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
              : 'bg-surface-800 border border-surface-700 text-surface-300 hover:bg-surface-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          Tags
          {selectedTags.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary-500 text-white">
              {selectedTags.length}
            </span>
          )}
        </button>
      </div>

      {/* Tag Filters Panel */}
      {showFilters && tags && tags.length > 0 && (
        <div className="p-4 rounded-lg bg-surface-800 border border-surface-700">
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
          <span className="text-sm text-surface-500">Active filters:</span>
          {searchQuery && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-700 text-surface-300 text-sm">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')} className="hover:text-surface-100 cursor-pointer">
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
            className="text-sm text-surface-500 hover:text-surface-300 cursor-pointer transition-colors"
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
          <p className="text-surface-400">
            {hasActiveFilters
              ? 'No snippets match your filters'
              : 'No snippets yet. Create your first one!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary-400 hover:text-primary-300 cursor-pointer transition-colors"
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
