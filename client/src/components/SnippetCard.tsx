import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, Edit } from 'lucide-react';
import type { Snippet } from '../types';

interface SnippetCardProps {
  snippet: Snippet;
  onEdit?: (snippet: Snippet) => void;
  onDelete?: (snippet: Snippet) => void;
  onClick?: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit, onDelete, onClick }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);

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

  const previewLines = snippet.code.split('\n').slice(0, 3).join('\n');
  const hasMoreLines = snippet.code.split('\n').length > 3;

  return (
    <div
      onClick={() => onClick?.(snippet)}
      className="card card-hover p-5 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-[var(--primary-900)]/30 flex-shrink-0">
            <FileCode className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-[var(--text)] truncate text-lg">
              {snippet.title}
            </h3>
            {snippet.description && (
              <p className="text-sm text-[var(--text-muted)] mt-0.5 line-clamp-1">
                {snippet.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="badge badge-primary">
            {snippet.language}
          </span>
          {snippet.is_public && (
            <span className="badge badge-accent">Public</span>
          )}
        </div>
      </div>

      {/* Code Preview */}
      <div className="relative mb-4 rounded-lg overflow-hidden bg-[#0f0f10] border border-[var(--border)]">
        <pre className="p-3 text-sm font-mono text-[var(--text-muted)] overflow-hidden">
          <code>{previewLines}</code>
        </pre>
        {hasMoreLines && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0f0f10] to-transparent" />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {snippet.tags?.map((tag) => (
            <span
              key={tag.id}
              className="badge badge-muted"
              style={{ 
                backgroundColor: `${tag.color}20`,
                color: tag.color 
              }}
            >
              {tag.name}
            </span>
          ))}
          {snippet.collection && (
            <span
              className="badge"
              style={{ 
                backgroundColor: `${snippet.collection.color}20`,
                color: snippet.collection.color 
              }}
            >
              {snippet.collection.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="btn btn-ghost p-2"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--success)]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleEdit}
            className="btn btn-ghost p-2"
            title="Edit snippet"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-ghost p-2 hover:text-[var(--error)]"
            title="Delete snippet"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Updated timestamp */}
      <p className="text-xs text-[var(--text-subtle)] mt-3">
        Updated {new Date(snippet.updated_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </p>
    </div>
  );
}
