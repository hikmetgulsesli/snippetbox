import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, Edit } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tags: { id: string; name: string; color: string }[];
  collection?: { id: string; name: string; color: string };
}

export interface SnippetCardProps {
  snippet: Snippet;
  onEdit?: (snippet: Snippet) => void;
  onDelete?: (snippet: Snippet) => void;
  onClick?: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit, onDelete, onClick }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const previewLines = snippet.code.split('\n').slice(0, 3);
  const hasMoreLines = snippet.code.split('\n').length > 3;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(snippet);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(snippet);
  };

  return (
    <div
      onClick={() => onClick?.(snippet)}
      className={cn(
        'group relative rounded-xl overflow-hidden',
        'bg-surface-800 border border-surface-700',
        'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10',
        'transition-all duration-200 cursor-pointer'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-surface-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <FileCode className="w-5 h-5 text-primary-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-surface-100 truncate">{snippet.title}</h3>
              {snippet.description && (
                <p className="text-sm text-surface-400 truncate mt-0.5">{snippet.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-md',
              'bg-surface-700 text-surface-300'
            )}>
              {snippet.language}
            </span>
            {snippet.is_public && (
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-md',
                'bg-accent-400/20 text-accent-400'
              )}>
                Public
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Code Preview */}
      <div className="relative bg-surface-900">
        <div className="p-4 font-mono text-sm">
          {previewLines.map((line, index) => (
            <div key={index} className="flex">
              <span className="select-none text-surface-600 w-8 text-right pr-3">{index + 1}</span>
              <span className={cn(
                'text-surface-300 truncate',
                index === previewLines.length - 1 && hasMoreLines && 'opacity-50'
              )}>
                {line || ' '}
              </span>
            </div>
          ))}
          {hasMoreLines && (
            <div className="flex">
              <span className="select-none text-surface-600 w-8 text-right pr-3">...</span>
              <span className="text-surface-500">{snippet.code.split('\n').length - 3} more lines</span>
            </div>
          )}
        </div>

        {/* Fade out effect */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-900 to-transparent" />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-surface-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {snippet.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className={cn(
                'p-2 rounded-lg transition-colors cursor-pointer',
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'
              )}
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-surface-500">
          Updated {new Date(snippet.updated_at).toLocaleDateString()}
          {snippet.collection && (
            <>
              {' '}·{' '}
              <span style={{ color: snippet.collection.color }}>{snippet.collection.name}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
