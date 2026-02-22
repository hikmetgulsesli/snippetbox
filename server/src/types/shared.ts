// Shared TypeScript interfaces for SnippetBox

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface CollectionInput {
  name: string;
  description?: string;
  color?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: Date;
  snippet_count?: number;
}

export interface TagInput {
  name: string;
  color?: string;
}

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  collection_id: string | null;
  collection?: Collection | null;
  is_public: boolean;
  share_id: string | null;
  created_at: Date;
  updated_at: Date;
  tags?: Tag[];
}

export interface SnippetInput {
  title: string;
  description?: string;
  code: string;
  language: string;
  collection_id?: string | null;
  tag_ids?: string[];
  is_public?: boolean;
}

export interface SnippetUpdateInput {
  title?: string;
  description?: string;
  code?: string;
  language?: string;
  collection_id?: string | null;
  tag_ids?: string[];
  is_public?: boolean;
}

export interface SnippetTag {
  snippet_id: string;
  tag_id: string;
}

export interface SnippetWithTags extends Snippet {
  tags: Tag[];
}

export interface SearchFilters {
  query?: string;
  language?: string;
  tag?: string;
  collection_id?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
