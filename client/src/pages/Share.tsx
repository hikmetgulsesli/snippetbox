import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, ArrowLeft, FileCode } from 'lucide-react';
import type { Snippet } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

export function Share() {
  const { shareId } = useParams<{ shareId: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  useEffect(() => {
    async function fetchSnippet() {
      try {
        const response = await fetch(`${API_URL}/snippets/share/${shareId}`);
        if (!response.ok) {
          throw new Error('Snippet not found or not public');
        }
        const data = await response.json();
        setSnippet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load snippet');
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      fetchSnippet();
    }
  }, [shareId]);

  const handleCopy = async () => {
    if (snippet) {
      try {
        await navigator.clipboard.writeText(snippet.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  const handleShare = async () => {
    if (snippet) {
      try {
        const shareUrl = `${window.location.origin}/s/${snippet.share_id}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy share link:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-900)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--surface-900)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--surface-100)] mb-4">Snippet Not Found</h1>
          <p className="text-[var(--surface-400)] mb-6">{error}</p>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Go to SnippetBox
          </Link>
        </div>
      </div>
    );
  }

  if (!snippet) return null;

  return (
    <div className="min-h-screen bg-[var(--surface-900)]">
      {/* Header */}
      <header className="border-b border-[var(--surface-700)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[var(--surface-400)] hover:text-[var(--surface-100)] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>SnippetBox</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
              Public
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title & Description */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--surface-100)] mb-2">{snippet.title}</h1>
          {snippet.description && (
            <p className="text-[var(--surface-400)]">{snippet.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-6 text-sm text-[var(--surface-500)]">
          <span className="flex items-center gap-1">
            <FileCode className="w-4 h-4" />
            {snippet.language}
          </span>
          {snippet.collection && (
            <span
              className="flex items-center gap-1"
              style={{ color: snippet.collection.color }}
            >
              {snippet.collection.name}
            </span>
          )}
        </div>

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {snippet.tags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Code */}
        <div className="relative rounded-lg overflow-hidden border border-[var(--surface-700)]">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--surface-800)] hover:bg-[var(--surface-700)] text-[var(--surface-300)] text-sm transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--surface-800)] hover:bg-[var(--surface-700)] text-[var(--surface-300)] text-sm transition-colors"
            >
              {shareLinkCopied ? <Check className="w-4 h-4 text-green-400" /> : <FileCode className="w-4 h-4" />}
              {shareLinkCopied ? 'Link copied!' : 'Share'}
            </button>
          </div>
          <div className="p-6 overflow-auto max-h-[50vh]">
            <pre className="code-block">
              <code className="text-[var(--text)]">{snippet.code}</code>
            </pre>
          </div>
        </div>

        {/* Share link */}
        <div className="mt-6 p-4 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)]">
          <p className="text-sm text-[var(--surface-400)] mb-2">Share this snippet</p>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 rounded bg-[var(--surface-900)] text-[var(--surface-300)] text-sm font-mono break-all">
              {window.location.origin}/s/{snippet.share_id}
            </code>
            <button
              onClick={handleShare}
              className="px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
            >
              {shareLinkCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
