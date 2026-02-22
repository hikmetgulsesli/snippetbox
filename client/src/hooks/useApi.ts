import { useQuery, useMutation, useQueryClient } from 'react-query';
import { snippetsApi, collectionsApi, tagsApi, statsApi, searchApi } from '../utils/api.js';
import type { Snippet, Collection, Tag, Stats, SearchFilters } from '../types/index.js';

// Snippets hooks
export function useSnippets() {
  return useQuery<Snippet[]>('snippets', snippetsApi.getAll);
}

export function useSnippet(id: string) {
  return useQuery<Snippet>(['snippet', id], () => snippetsApi.getById(id), {
    enabled: !!id,
  });
}

export function useCreateSnippet() {
  const queryClient = useQueryClient();
  return useMutation(snippetsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('snippets');
      queryClient.invalidateQueries('stats');
    },
  });
}

export function useUpdateSnippet() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: unknown }) => snippetsApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('snippets');
      },
    }
  );
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();
  return useMutation(snippetsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('snippets');
      queryClient.invalidateQueries('stats');
    },
  });
}

// Collections hooks
export function useCollections() {
  return useQuery<Collection[]>('collections', collectionsApi.getAll);
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation(collectionsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('collections');
      queryClient.invalidateQueries('stats');
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: unknown }) => collectionsApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('collections');
      },
    }
  );
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation(collectionsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('collections');
      queryClient.invalidateQueries('snippets');
      queryClient.invalidateQueries('stats');
    },
  });
}

// Tags hooks
export function useTags() {
  return useQuery<Tag[]>('tags', tagsApi.getAll);
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation(tagsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('tags');
      queryClient.invalidateQueries('stats');
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation(tagsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('tags');
      queryClient.invalidateQueries('snippets');
      queryClient.invalidateQueries('stats');
    },
  });
}

// Stats hook
export function useStats() {
  return useQuery<Stats>('stats', statsApi.getAll);
}

// Search hook
export function useSearch(filters: SearchFilters) {
  const params: Record<string, string> = {};
  if (filters.q) params.q = filters.q;
  if (filters.language) params.language = filters.language;
  if (filters.tag) params.tag = filters.tag;
  if (filters.collection) params.collection = filters.collection;
  if (filters.sort) params.sort = filters.sort;

  return useQuery<Snippet[]>(
    ['search', filters],
    () => searchApi.search(params),
    {
      enabled: Object.keys(params).length > 0,
    }
  );
}
