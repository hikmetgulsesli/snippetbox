import { useState } from 'react'
import { 
  LayoutDashboard, 
  Code2, 
  FolderOpen, 
  Tags, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import type { Collection } from '../types'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_URL}/api/collections`)
  if (!response.ok) throw new Error('Failed to fetch collections')
  return response.json()
}

async function fetchUncategorizedCount(): Promise<{ meta: { total: number } }> {
  const response = await fetch(`${API_URL}/api/snippets?collection_id=null`)
  if (!response.ok) throw new Error('Failed to fetch uncategorized snippets')
  return response.json()
}

async function createCollection(data: { name: string; description?: string; color?: string }): Promise<Collection> {
  const response = await fetch(`${API_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create collection')
  return response.json()
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/snippets', icon: Code2, label: 'All Snippets' },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const { data: collections = [] } = useQuery('collections', fetchCollections)
  const { data: uncategorizedData } = useQuery('uncategorized-count', fetchUncategorizedCount)

  const createMutation = useMutation(createCollection, {
    onSuccess: () => {
      queryClient.invalidateQueries('collections')
      setShowCreateModal(false)
      setNewCollectionName('')
    },
  })

  const uncategorizedCount = uncategorizedData?.meta?.total || 0

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCollectionName.trim()) {
      createMutation.mutate({ name: newCollectionName.trim() })
    }
  }

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-50',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {isOpen && (
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary-600" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">SnippetBox</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        <nav className="p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            ))}

            {/* Uncategorized */}
            <li>
              <NavLink
                to="/snippets?filter=uncategorized"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  )
                }
              >
                <FolderOpen className="w-5 h-5 flex-shrink-0" />
                {isOpen && (
                  <span className="font-medium flex-1">Uncategorized</span>
                )}
                {isOpen && uncategorizedCount > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {uncategorizedCount}
                  </span>
                )}
              </NavLink>
            </li>

            {/* Collections Section */}
            {isOpen && (
              <li className="pt-4 pb-2">
                <div className="flex items-center justify-between px-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Collections
                  </span>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    title="Create collection"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </li>
            )}

            {collections.map((collection) => (
              <li key={collection.id}>
                <NavLink
                  to={`/snippets?collection=${collection.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    )
                  }
                >
                  <FolderOpen 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: collection.color }}
                  />
                  {isOpen && (
                    <>
                      <span className="font-medium flex-1 truncate">{collection.name}</span>
                      {collection.snippet_count !== undefined && collection.snippet_count > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {collection.snippet_count}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}

            {/* Divider */}
            <li className="pt-4">
              <div className="border-t border-gray-200 dark:border-gray-700 mx-2" />
            </li>

            {/* Other nav items */}
            {[
              { path: '/tags', icon: Tags, label: 'Tags' },
              { path: '/settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Collection
            </h2>
            <form onSubmit={handleCreateCollection}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="My Collection"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCollectionName('')
                  }}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim() || createMutation.isLoading}
                  className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
