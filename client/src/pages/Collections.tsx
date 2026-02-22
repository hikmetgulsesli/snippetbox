import { useQuery } from 'react-query'
import { FolderOpen, Plus, MoreVertical } from 'lucide-react'

interface Collection {
  id: string
  name: string
  description?: string
  color: string
  snippet_count: number
}

async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch('/api/collections')
  if (!response.ok) throw new Error('Failed to fetch collections')
  return response.json()
}

export function Collections() {
  const { data: collections, isLoading } = useQuery('collections', fetchCollections)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections?.map((collection) => (
            <div
              key={collection.id}
              className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: collection.color + '20' }}
                >
                  <FolderOpen
                    className="w-6 h-6"
                    style={{ color: collection.color }}
                  />
                </div>
                <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="mt-1 text-sm text-gray-500">{collection.description}</p>
              )}

              <p className="mt-3 text-sm text-gray-500">
                {collection.snippet_count} snippet{collection.snippet_count !== 1 ? 's' : ''}
              </p>
            </div>
          )) || <p className="text-gray-500 col-span-full">No collections yet</p>}
        </div>
      )}
    </div>
  )
}
