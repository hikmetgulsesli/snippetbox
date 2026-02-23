import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { FolderOpen, Plus, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { DeleteModal } from '../components/DeleteModal'
import type { CollectionFormData } from '../types'
import type { Collection as CollectionType } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3512';

interface Collection extends CollectionType {
  snippet_count: number
}

async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_URL}/api/collections`)
  if (!response.ok) throw new Error('Failed to fetch collections')
  return response.json()
}

async function createCollection(data: CollectionFormData): Promise<Collection> {
  const response = await fetch(`${API_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create collection')
  return response.json()
}

async function updateCollection(id: string, data: Partial<CollectionFormData>): Promise<Collection> {
  const response = await fetch(`${API_URL}/api/collections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update collection')
  return response.json()
}

async function deleteCollection(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/collections/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete collection')
}

export function Collections() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const { data: collections, isLoading } = useQuery('collections', fetchCollections)

  const createMutation = useMutation(createCollection, {
    onSuccess: () => {
      queryClient.invalidateQueries('collections')
      setShowCreateModal(false)
    },
  })

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CollectionFormData> }) => updateCollection(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('collections')
        setEditingCollection(null)
      },
    }
  )

  const deleteMutation = useMutation(deleteCollection, {
    onSuccess: () => {
      queryClient.invalidateQueries('collections')
      setDeletingCollection(null)
    },
  })

  const handleDelete = () => {
    if (deletingCollection) {
      deleteMutation.mutate(deletingCollection.id)
    }
  }

  // Close menu when clicking outside
  const handleClickOutside = () => {
    setOpenMenuId(null)
  }

  return (
    <div className="space-y-6" onClick={handleClickOutside}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 cursor-pointer transition-colors"
        >
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
      ) : collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="card p-6 hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={(e) => e.stopPropagation()}
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
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === collection.id ? null : collection.id)
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {openMenuId === collection.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingCollection(collection)
                          setOpenMenuId(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingCollection(collection)
                          setOpenMenuId(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">No collections yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-primary-500 hover:text-primary-600 cursor-pointer transition-colors"
          >
            Create your first collection
          </button>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CollectionModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isLoading}
        />
      )}

      {/* Edit Collection Modal */}
      {editingCollection && (
        <CollectionModal
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingCollection.id, data })}
          isSubmitting={updateMutation.isLoading}
        />
      )}

      {/* Delete Confirmation */}
      {deletingCollection && (
        <DeleteModal
          onClose={() => setDeletingCollection(null)}
          onConfirm={handleDelete}
          title="Delete Collection"
          message={`Are you sure you want to delete "${deletingCollection.name}"? Snippets in this collection will become uncategorized.`}
          isDeleting={deleteMutation.isLoading}
        />
      )}
    </div>
  )
}

interface CollectionModalProps {
  collection?: Collection
  onClose: () => void
  onSubmit: (data: CollectionFormData) => void
  isSubmitting: boolean
}

function CollectionModal({ collection, onClose, onSubmit, isSubmitting }: CollectionModalProps) {
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [color, setColor] = useState(collection?.color || '#3B82F6')

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description: description || null, color })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {collection ? 'Edit Collection' : 'Create Collection'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="My Collection"
              autoFocus
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Description..."
              rows={2}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Saving...' : collection ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
