import { useState } from 'react';
import { X, FileCode, Folder, Tag, Globe } from 'lucide-react';
import type { Snippet, SnippetInput, Collection, Tag as TagType } from '../types';

interface SnippetFormProps {
  snippet?: Snippet;
  collections: Collection[];
  tags: TagType[];
  onSubmit: (data: SnippetInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const languages = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp',
  'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'scss', 'json', 'yaml',
  'markdown', 'bash', 'powershell', 'dockerfile', 'nginx'
];

export function SnippetForm({ snippet, collections, tags, onSubmit, onCancel, isSubmitting }: SnippetFormProps) {
  const [formData, setFormData] = useState<SnippetInput>({
    title: snippet?.title || '',
    description: snippet?.description || '',
    code: snippet?.code || '',
    language: snippet?.language || 'javascript',
    collection_id: snippet?.collection_id || null,
    tags: snippet?.tags?.map(t => t.id) || [],
    is_public: snippet?.is_public || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    }

    if (!formData.language.trim()) {
      newErrors.language = 'Language is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...(prev.tags || []), tagId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--primary-900)]/30">
              <FileCode className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[var(--text)]">
              {snippet ? 'Edit Snippet' : 'New Snippet'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="btn btn-ghost p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter snippet title..."
              />
              {errors.title && (
                <p className="text-sm text-[var(--error)] mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="Brief description of the snippet..."
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className={`input ${errors.language ? 'input-error' : ''}`}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {errors.language && (
                <p className="text-sm text-[var(--error)] mt-1">{errors.language}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Code *
              </label>
              <textarea
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={`input font-mono min-h-[200px] resize-y ${errors.code ? 'input-error' : ''}`}
                placeholder="Paste your code here..."
                spellCheck={false}
              />
              {errors.code && (
                <p className="text-sm text-[var(--error)] mt-1">{errors.code}</p>
              )}
            </div>

            {/* Collection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4" /> Collection
              </label>
              <select
                value={formData.collection_id || ''}
                onChange={(e) => setFormData({ ...formData, collection_id: e.target.value || null })}
                className="input"
              >
                <option value="">No collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`badge cursor-pointer transition-all duration-200 ${
                      formData.tags?.includes(tag.id)
                        ? 'ring-2 ring-[var(--primary)]'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: formData.tags?.includes(tag.id) 
                        ? `${tag.color}30`
                        : `${tag.color}15`,
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)]">
              <Globe className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text)]">
                  Make this snippet public
                </label>
                <p className="text-xs text-[var(--text-muted)]">
                  Public snippets can be shared with others via a unique link
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  formData.is_public ? 'bg-[var(--primary)]' : 'bg-[var(--surface-elevated)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    formData.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting 
                ? (snippet ? 'Saving...' : 'Creating...') 
                : (snippet ? 'Save Changes' : 'Create Snippet')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
