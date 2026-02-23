import { useState } from 'react';
import { X, FileCode, Folder, Globe } from 'lucide-react';
import { TagInput, type Tag } from './TagInput';
import type { Snippet, SnippetInput, Collection } from '../types';

interface SnippetFormProps {
  snippet?: Snippet | undefined;
  collections: Collection[];
  tags: Tag[];
  onSubmit: (data: SnippetInput) => void;
  onCancel?: () => void;
  onClose?: () => void;
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
    tag_ids: snippet?.tags?.map(t => t.id) || [],
    is_public: snippet?.is_public || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.code?.trim()) {
      newErrors.code = 'Code is required';
    }

    if (!formData.language?.trim()) {
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

  const handleTagsChange = (selectedTags: Tag[]) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: selectedTags.map(t => t.id)
    }));
  };

  // Convert snippet tags to Tag type for TagInput
  const selectedTags = tags.filter(t => formData.tag_ids?.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-surface-800 border border-surface-700 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <FileCode className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-surface-100">
              {snippet ? 'Edit Snippet' : 'New Snippet'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter snippet title..."
              />
              {errors.title && (
                <p className="text-sm text-red-400 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
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
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className={`input ${errors.language ? 'border-red-500' : ''}`}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {errors.language && (
                <p className="text-sm text-red-400 mt-1">{errors.language}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Code *
              </label>
              <textarea
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={`input font-mono min-h-[200px] resize-y ${errors.code ? 'border-red-500' : ''}`}
                placeholder="Paste your code here..."
                spellCheck={false}
              />
              {errors.code && (
                <p className="text-sm text-red-400 mt-1">{errors.code}</p>
              )}
            </div>

            {/* Collection */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2 flex items-center gap-2">
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

            {/* Tags with TagInput */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Tags
              </label>
              <TagInput
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                placeholder="Search or create tags..."
              />
            </div>

            {/* Public toggle */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-900 border border-surface-700">
              <Globe className="w-5 h-5 text-surface-500" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-surface-200">
                  Make this snippet public
                </label>
                <p className="text-xs text-surface-500">
                  Public snippets can be shared with others via a unique link
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  formData.is_public ? 'bg-primary-500' : 'bg-surface-600'
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
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-surface-700">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg font-medium text-surface-300 hover:text-surface-100 hover:bg-surface-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
