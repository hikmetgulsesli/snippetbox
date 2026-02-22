import { useState } from 'react';
import { useQuery } from 'react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { SnippetCard, type Snippet } from '../components/SnippetCard';
import { SnippetDetail } from '../components/SnippetDetail';
import { SnippetForm, type SnippetFormData } from '../components/SnippetForm';
import { Modal } from '../components/Modal';
import { DeleteConfirmationModal } from '../components/Modal';
import { SnippetCardSkeleton } from '../components/Skeleton';

async function fetchSnippets(): Promise<Snippet[]> {
  const response = await fetch('/api/snippets');
  if (!response.ok) throw new Error('Failed to fetch snippets');
  return response.json();
}

export function Snippets() {
  const { data: snippets, isLoading, refetch } = useQuery('snippets', fetchSnippets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<Snippet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSnippets = snippets?.filter((snippet) =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (data: SnippetFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create snippet');
      setIsCreating(false);
      refetch();
    } catch (err) {
      console.error('Failed to create snippet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: SnippetFormData) => {
    if (!editingSnippet) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update snippet');
      setEditingSnippet(null);
      setSelectedSnippet(null);
      refetch();
    } catch (err) {
      console.error('Failed to update snippet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSnippet) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/snippets/${deletingSnippet.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete snippet');
      setDeletingSnippet(null);
      setSelectedSnippet(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete snippet:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Show detail view
  if (selectedSnippet) {
    return (
      <SnippetDetail
        snippet={selectedSnippet}
        onBack={() => setSelectedSnippet(null)}
        onEdit={setEditingSnippet}
        onDelete={setDeletingSnippet}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-100">Snippets</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <button className="btn-secondary flex items-center justify-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Snippets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SnippetCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSnippets && filteredSnippets.length > 0 ? (
            filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onClick={setSelectedSnippet}
                onEdit={setEditingSnippet}
                onDelete={setDeletingSnippet}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-surface-400">
                {searchQuery ? 'No snippets match your search' : 'No snippets yet. Create your first one!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create New Snippet"
        size="lg"
      >
        <SnippetForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingSnippet}
        onClose={() => setEditingSnippet(null)}
        title="Edit Snippet"
        size="lg"
      >
        {editingSnippet && (
          <SnippetForm
            snippet={editingSnippet}
            onSubmit={handleUpdate}
            onCancel={() => setEditingSnippet(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={!!deletingSnippet}
        onClose={() => setDeletingSnippet(null)}
        onConfirm={handleDelete}
        title="Delete Snippet"
        message={`Are you sure you want to delete "${deletingSnippet?.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
