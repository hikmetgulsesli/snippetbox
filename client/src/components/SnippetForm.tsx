import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Snippet } from './SnippetCard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SnippetFormData {
  title: string;
  description: string;
  code: string;
  language: string;
  is_public: boolean;
  collection_id?: string;
  tags: string[];
}

export interface SnippetFormProps {
  snippet?: Snippet;
  onSubmit: (data: SnippetFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SnippetForm({ snippet, onSubmit, onCancel, isSubmitting }: SnippetFormProps) {
  const [formData, setFormData] = useState<SnippetFormData>({
    title: snippet?.title || '',
    description: snippet?.description || '',
    code: snippet?.code || '',
    language: snippet?.language || 'javascript',
    is_public: snippet?.is_public || false,
    collection_id: snippet?.collection?.id,
    tags: snippet?.tags.map(t => t.id) || [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SnippetFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SnippetFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
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

  const languages = [
    'javascript', 'typescript', 'python', 'go', 'rust', 'java',
    'c', 'cpp', 'sql', 'html', 'css', 'json', 'yaml',
    'bash', 'markdown', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'docker', 'text'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-surface-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={cn(
            'w-full px-4 py-2 rounded-lg bg-surface-800 border text-surface-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            errors.title ? 'border-red-500' : 'border-surface-700'
          )}
          placeholder="Enter snippet title..."
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-surface-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className={cn(
            'w-full px-4 py-2 rounded-lg bg-surface-800 border text-surface-100 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            errors.description ? 'border-red-500' : 'border-surface-700'
          )}
          placeholder="Enter description (optional)..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Language */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-surface-300 mb-2">
          Language
        </label>
        <select
          id="language"
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Code */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-surface-300 mb-2">
          Code *
        </label>
        <textarea
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          rows={12}
          className={cn(
            'w-full px-4 py-2 rounded-lg bg-surface-800 border text-surface-100 font-mono text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y',
            errors.code ? 'border-red-500' : 'border-surface-700'
          )}
          placeholder="Enter your code here..."
        />
        {errors.code && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.code}
          </p>
        )}
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          className="w-5 h-5 rounded border-surface-700 bg-surface-800 text-primary-500 focus:ring-primary-500 cursor-pointer"
        />
        <label htmlFor="is_public" className="text-sm text-surface-300 cursor-pointer">
          Make this snippet public
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg font-medium text-surface-300 hover:text-surface-100 hover:bg-surface-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : snippet ? 'Update Snippet' : 'Create Snippet'}
        </button>
      </div>
    </form>
  );
}
