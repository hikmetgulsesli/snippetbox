import type { SnippetFormData, CollectionFormData, TagFormData } from '../types/index.js';

const API_URL = import.meta.env.VITE_API_URL ?? '';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Snippets API
export const snippetsApi = {
  getAll: () => fetchApi('/api/snippets'),
  getById: (id: string) => fetchApi(`/api/snippets/${id}`),
  create: (data: SnippetFormData) => fetchApi('/api/snippets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SnippetFormData>) => fetchApi(`/api/snippets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/api/snippets/${id}`, { method: 'DELETE' }),
};

// Collections API
export const collectionsApi = {
  getAll: () => fetchApi('/api/collections'),
  create: (data: CollectionFormData) => fetchApi('/api/collections', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CollectionFormData>) => fetchApi(`/api/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/api/collections/${id}`, { method: 'DELETE' }),
};

// Tags API
export const tagsApi = {
  getAll: () => fetchApi('/api/tags'),
  create: (data: TagFormData) => fetchApi('/api/tags', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/api/tags/${id}`, { method: 'DELETE' }),
};

// Search API
export const searchApi = {
  search: (params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchApi(`/api/search?${queryString}`);
  },
};

// Stats API
export const statsApi = {
  getAll: () => fetchApi('/api/stats'),
};

// Import/Export API
export const importExportApi = {
  export: () => fetchApi('/api/import-export/export'),
  import: (data: unknown[]) => fetchApi('/api/import-export/import', { method: 'POST', body: JSON.stringify(data) }),
};

// Health check
export const healthApi = {
  check: () => fetchApi('/health'),
};
