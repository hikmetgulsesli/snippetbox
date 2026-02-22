import { useState } from 'react'
import { useQuery } from 'react-query'
import { Plus, Search, Filter } from 'lucide-react'

interface Snippet {
  id: string
  title: string
  description?: string
  code: string
  language: string
  is_public: boolean
  created_at: string
  updated_at: string
  tags: { id: string; name: string; color: string }[]
  collection?: { id: string; name: string; color: string }
}

async function fetchSnippets(): Promise<Snippet[]> {
  const response = await fetch('/api/snippets')
  if (!response.ok) throw new Error('Failed to fetch snippets')
  return response.json()
}

export function Snippets() {
  const { data: snippets, isLoading } = useQuery('snippets', fetchSnippets)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSnippets = snippets?.filter((snippet) =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Snippets</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Snippet
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Snippets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSnippets?.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          )) || <p className="text-gray-500">No snippets found</p>}
        </div>
      )}
    </div>
  )
}

function SnippetCard({ snippet }: { snippet: Snippet }) {
  const previewLines = snippet.code.split('\n').slice(0, 3).join('\n')

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{snippet.title}</h3>
          {snippet.description && (
            <p className="text-sm text-gray-500 mt-1">{snippet.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {snippet.language}
          </span>
          {snippet.is_public && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              Public
            </span>
          )}
        </div>
      </div>

      <pre className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
        <code className="text-sm text-gray-300 font-mono">{previewLines}</code>
        {snippet.code.split('\n').length > 3 && (
          <span className="text-gray-500">... ({snippet.code.split('\n').length - 3} more lines)</span>
        )}
      </pre>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {snippet.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          Updated {new Date(snippet.updated_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
