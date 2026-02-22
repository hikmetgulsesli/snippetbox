import { useQuery } from 'react-query'
import { Plus, Hash } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
  snippet_count: number
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags')
  if (!response.ok) throw new Error('Failed to fetch tags')
  return response.json()
}

export function Tags() {
  const { data: tags, isLoading } = useQuery('tags', fetchTags)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Tag
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-10 w-24 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags?.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: tag.color + '20' }}
            >
              <Hash className="w-4 h-4" style={{ color: tag.color }} />
              <span className="font-medium" style={{ color: tag.color }}>
                {tag.name}
              </span>
              <span
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ backgroundColor: tag.color + '30', color: tag.color }}
              >
                {tag.snippet_count}
              </span>
            </div>
          )) || <p className="text-gray-500">No tags yet</p>}
        </div>
      )}
    </div>
  )
}
