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
  created_at: string;
  updated_at: string;
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
