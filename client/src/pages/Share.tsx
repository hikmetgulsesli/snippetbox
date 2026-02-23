import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, ArrowLeft, FileCode, Tag } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: { id: string; name: string; color: string }[];
  collection: { id: string; name: string; color: string } | null;
  is_public: boolean;
}

export function Share() {
  const { shareId } = useParams<{ shareId: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSnippet() {
      try {
        const response = await fetch(`${API_URL}/s/${shareId}`);
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
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Snippet Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Go to SnippetBox
          </Link>
        </div>
      </div>
    );
  }

  if (!snippet) return null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
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
          <h1 className="text-3xl font-bold text-white mb-2">{snippet.title}</h1>
          {snippet.description && (
            <p className="text-gray-400">{snippet.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
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
        <div className="relative rounded-lg overflow-hidden border border-gray-800">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <SyntaxHighlighter
            language={snippet.language}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#1e1e1e',
              fontSize: '14px',
            }}
          >
            {snippet.code}
          </SyntaxHighlighter>
        </div>
      </main>
    </div>
  );
}
