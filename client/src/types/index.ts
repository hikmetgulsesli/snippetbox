// SnippetBox Type Definitions

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  collection_id: string | null;
  is_public: boolean;
  share_id: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  collection: Collection | null;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  snippet_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  snippet_count?: number;
}

export interface Stats {
  total_snippets: number;
  by_language: { language: string; count: number }[];
  recent_snippets: Snippet[];
  top_tags: { name: string; color: string; count: number }[];
  collection_sizes: { name: string; color: string; count: number }[];
  timeline: { date: string; count: number }[];
}

export interface SnippetFormData {
  title: string;
  description: string | null;
  code: string;
  language: string;
  collection_id: string | null;
  tags: string[];
  is_public: boolean;
}

export interface CollectionFormData {
  name: string;
  description: string | null;
  color: string;
}

export interface TagFormData {
  name: string;
  color: string;
}

export interface SearchFilters {
  q?: string;
  language?: string;
  tag?: string;
  collection?: string;
  sort?: 'created_at' | 'updated_at' | 'title' | 'language';
}
