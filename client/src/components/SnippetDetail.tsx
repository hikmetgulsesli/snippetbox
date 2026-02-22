import { useState } from 'react';
import { FileCode, Copy, Check, ArrowLeft, Edit, Trash2, Globe, Lock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Snippet } from './SnippetCard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SnippetDetailProps {
  snippet: Snippet;
  onBack?: () => void;
  onEdit?: (snippet: Snippet) => void;
  onDelete?: (snippet: Snippet) => void;
}

export function SnippetDetail({ snippet, onBack, onEdit, onDelete }: SnippetDetailProps) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <FileCode className="w-6 h-6 text-primary-400" />
              <h1 className="text-2xl font-bold text-surface-100">{snippet.title}</h1>
            </div>
            {snippet.description && (
              <p className="text-surface-400 mt-1">{snippet.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(snippet)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-surface-800 text-surface-200 hover:bg-surface-700 transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(snippet)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-surface-800 rounded-lg border border-surface-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">Language:</span>
          <span className="px-2 py-1 text-sm font-medium rounded bg-surface-700 text-surface-200">
            {snippet.language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">Visibility:</span>
          {snippet.is_public ? (
            <span className="flex items-center gap-1 px-2 py-1 text-sm font-medium rounded bg-accent-400/20 text-accent-400">
              <Globe className="w-3.5 h-3.5" />
              Public
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 text-sm font-medium rounded bg-surface-700 text-surface-400">
              <Lock className="w-3.5 h-3.5" />
              Private
            </span>
          )}
        </div>

        {snippet.collection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-surface-400">Collection:</span>
            <span
              className="px-2 py-1 text-sm font-medium rounded"
              style={{ backgroundColor: snippet.collection.color + '20', color: snippet.collection.color }}
            >
              {snippet.collection.name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">Updated:</span>
          <span className="text-sm text-surface-300">
            {new Date(snippet.updated_at).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">Lines:</span>
          <span className="text-sm text-surface-300">{snippet.code.split('\n').length}</span>
        </div>
      </div>

      {/* Tags */}
      {snippet.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-surface-400">Tags:</span>
          {snippet.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-3 py-1 text-sm font-medium rounded-full"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Code */}
      <div className="rounded-xl overflow-hidden border border-surface-700">
        <div className="flex items-center justify-between px-4 py-2 bg-surface-800 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="ml-3 text-sm text-surface-400 font-mono">{snippet.language}</span>
          </div>
        </div>

        <div className="overflow-x-auto bg-surface-900">
          <pre className="p-4 font-mono text-sm leading-relaxed">
            <code className="text-surface-200">{snippet.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
