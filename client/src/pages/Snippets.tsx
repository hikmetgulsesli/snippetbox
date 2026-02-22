import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { SnippetCard } from '../components/SnippetCard';
import { SnippetDetail } from '../components/SnippetDetail';
import { SnippetForm } from '../components/SnippetForm';
import { DeleteModal } from '../components/DeleteModal';
import { SnippetListSkeleton } from '../components/Skeletons';
import type { Snippet, SnippetInput, Collection, Tag } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

async function fetchSnippets(): Promise<Snippet[]> {
  const response = await fetch(`${API_URL}/api/snippets`);
  if (!response.ok) throw new Error('Failed to fetch snippets');
  return response.json();
}

async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_URL}/api/collections`);
  if (!response.ok) throw new Error('Failed to fetch collections');
  return response.json();
}

async function fetchTags(): Promise<Tag[]> {
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
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<Snippet | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: snippets, isLoading: isLoadingSnippets } = useQuery('snippets', fetchSnippets);
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

  const query = searchQuery.toLowerCase();
  const filteredSnippets = snippets?.filter((snippet) =>
    snippet.title.toLowerCase().includes(query) ||
    snippet.description?.toLowerCase().includes(query) ||
    snippet.code.toLowerCase().includes(query) ||
    snippet.language.toLowerCase().includes(query)
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-[var(--text)]">Snippets</h1>
          <p className="text-[var(--text-muted)] mt-1">
            {snippets?.length || 0} code snippets
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-subtle)]" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="btn btn-secondary flex items-center justify-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Snippets List */}
      {isLoading ? (
        <SnippetListSkeleton count={3} />
      ) : (
        <div className="space-y-4">
          {filteredSnippets?.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onClick={setSelectedSnippet}
              onEdit={(s) => {
                setEditingSnippet(s);
                setSelectedSnippet(null);
              }}
              onDelete={(s) => {
                setDeletingSnippet(s);
                setSelectedSnippet(null);
              }}
            />
          ))}
          {filteredSnippets?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">
                {searchQuery ? 'No snippets match your search' : 'No snippets yet. Create your first one!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedSnippet && (
        <SnippetDetail
          snippet={selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          onEdit={(s) => {
            setEditingSnippet(s);
            setSelectedSnippet(null);
          }}
          onDelete={(s) => {
            setDeletingSnippet(s);
            setSelectedSnippet(null);
          }}
        />
      )}

      {isCreating && collections && tags && (
        <SnippetForm
          collections={collections}
          tags={tags}
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createMutation.isLoading}
        />
      )}

      {editingSnippet && collections && tags && (
        <SnippetForm
          snippet={editingSnippet}
          collections={collections}
          tags={tags}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSnippet(null)}
          isSubmitting={updateMutation.isLoading}
        />
      )}

      {deletingSnippet && (
        <DeleteModal
          title="Delete Snippet"
          message={`Are you sure you want to delete "${deletingSnippet.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingSnippet(null)}
          isDeleting={deleteMutation.isLoading}
        />
      )}
    </div>
  );
}
