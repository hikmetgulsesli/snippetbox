import { useState } from 'react';
import { FileCode, Copy, Check, X, Trash2, Edit, Calendar, Folder, Tag } from 'lucide-react';
import type { Snippet } from '../types';

interface SnippetDetailProps {
  snippet: Snippet;
  onClose: () => void;
  onEdit?: (snippet: Snippet) => void;
  onDelete?: (snippet: Snippet) => void;
}

export function SnippetDetail({ snippet, onClose, onEdit, onDelete }: SnippetDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEdit = () => {
    onEdit?.(snippet);
  };

  const handleDelete = () => {
    onDelete?.(snippet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[var(--primary-900)]/30">
              <FileCode className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-[var(--text)]">
                {snippet.title}
              </h2>
              {snippet.description && (
                <p className="text-[var(--text-muted)] mt-1">{snippet.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <span className="badge badge-primary">{snippet.language}</span>
                {snippet.is_public && <span className="badge badge-accent">Public</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn btn-secondary flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-secondary flex items-center gap-2 text-[var(--error)] hover:bg-[var(--error)]/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost p-2 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="p-6 overflow-auto max-h-[50vh]">
          <pre className="code-block">
            <code className="text-[var(--text)]">{snippet.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                Created {new Date(snippet.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                Updated {new Date(snippet.updated_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            {snippet.collection && (
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>{snippet.collection.name}</span>
              </div>
            )}

            {snippet.tags && snippet.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <div className="flex items-center gap-1">
                  {snippet.tags.map((tag) => (
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
