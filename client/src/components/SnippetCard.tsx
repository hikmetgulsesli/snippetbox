import { useState, useEffect, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, Edit, FolderInput, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import type { Snippet, Collection } from '../types';

interface SnippetCardProps {
  snippet: Snippet;
  onEdit?: (snippet: Snippet) => void;
  onDelete?: (snippet: Snippet) => void;
  onClick?: (snippet: Snippet) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_URL}/api/collections`)
  if (!response.ok) throw new Error('Failed to fetch collections')
  return response.json()
}

async function moveToCollection(snippetId: string, collectionId: string | null): Promise<Snippet> {
  const response = await fetch(`${API_URL}/api/snippets/${snippetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection_id: collectionId }),
  })
  if (!response.ok) throw new Error('Failed to move snippet')
  return response.json()
}

export function SnippetCard({ snippet, onEdit, onDelete, onClick }: SnippetCardProps) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: collections = [] } = useQuery('collections', fetchCollections)
  const moveMutation = useMutation(
    ({ snippetId, collectionId }: { snippetId: string; collectionId: string | null }) => 
      moveToCollection(snippetId, collectionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('snippets')
        queryClient.invalidateQueries('collections')
        setShowMoveMenu(false)
      },
    }
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoveMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
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

  const handleMoveTo = (collectionId: string | null) => {
    moveMutation.mutate({ snippetId: snippet.id, collectionId })
  }

  const lines = snippet.code.split('\n');
  const previewLines = lines.slice(0, 3).join('\n');
  const hasMoreLines = lines.length > 3;

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
          
          {/* Move to Collection Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMoveMenu(!showMoveMenu)
              }}
              className="btn btn-ghost p-2"
              title="Move to collection"
            >
              <FolderInput className="w-4 h-4" />
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showMoveMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showMoveMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                  Move to
                </div>
                
                {/* Uncategorized option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveTo(null)
                  }}
                  className={`w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer transition-colors ${
                    !snippet.collection_id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-gray-400" />
                  Uncategorized
                </button>
                
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveTo(collection.id)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer transition-colors ${
                      snippet.collection_id === collection.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: collection.color }} />
                    <span className="truncate">{collection.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
