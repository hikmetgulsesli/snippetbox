import { z } from 'zod';

// Language detection patterns
const languagePatterns: Record<string, RegExp> = {
  typescript: /\b(interface|type\s+\w+|:\s*(string|number|boolean|any)\b)\b/,
  python: /\b(def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import)\b/,
  java: /\b(public\s+class|private\s+|protected\s+|void\s+\w+\s*\()\b/,
  go: /\b(func\s+\w+|package\s+\w+|import\s+\(\s*")\b/,
  rust: /\b(fn\s+\w+|let\s+mut|impl\s+|use\s+\w+::)\b/,
  ruby: /\b(def\s+\w+|class\s+\w+\s*<|require\s+['"])\b/,
  php: /\b(\u003c\?php|\$\w+\s*=|function\s+\w+\s*\()\b/,
  swift: /\b(func\s+\w+|var\s+\w+|let\s+\w+|import\s+\w+)\b/,
  kotlin: /\b(fun\s+\w+|val\s+\w+|var\s+\w+|package\s+\w+)\b/,
  csharp: /\b(using\s+\w+|namespace\s+\w+|public\s+class)\b/,
  sql: /\b(SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/i,
  html: /\b(<!DOCTYPE\s+html|<html|<head|<body)>?/i,
  css: /\b([.#]\w+\s*\{|@media\s+|@import\s+)\b/,
  scss: /\b(@mixin\s+|@include\s+|\$\w+\s*:)\b/,
  bash: /\b(echo\s+|#!\/bin\/bash|#!\/bin\/sh)\b/,
  powershell: /\b(Get-|Set-|Write-|\$env:)\b/,
  dockerfile: /\b(FROM\s+|RUN\s+|CMD\s+|EXPOSE\s+)\b/i,
  yaml: /\b(\w+:\s*\n|\s+-\s+\w+:)\b/,
  json: /^\s*(\[|\{).*(\]|\})\s*$/,
  markdown: /\b(#{1,6}\s+|\*\s+.+?\n)/,
};

// File extension to language mapping
const extensionMap: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.cs': 'csharp',
  '.sql': 'sql',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'scss',
  '.sh': 'bash',
  '.bash': 'bash',
  '.ps1': 'powershell',
  '.dockerfile': 'dockerfile',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.json': 'json',
  '.md': 'markdown',
  '.txt': 'text',
};

export function detectLanguage(code: string, filename?: string): string {
  // First try filename extension
  if (filename) {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext && extensionMap[ext]) {
      return extensionMap[ext];
    }
  }

  // Then try pattern matching
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(code)) {
      return lang;
    }
  }

  return 'text';
}

// Snippet schemas
export const createSnippetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  code: z.string().min(1, 'Code is required'),
  language: z.string().optional(),
  collection_id: z.string().uuid().optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
  is_public: z.boolean().optional(),
  filename: z.string().optional(), // For auto-detection
});

export const updateSnippetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  code: z.string().min(1).optional(),
  language: z.string().optional(),
  collection_id: z.string().uuid().optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
  is_public: z.boolean().optional(),
  filename: z.string().optional(),
});

export const snippetParamsSchema = z.object({
  id: z.string().uuid('Invalid snippet ID'),
});

export const listSnippetsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
  language: z.string().optional(),
  collection_id: z.string().uuid().optional(),
  tag: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
export type ListSnippetsQuery = z.infer<typeof listSnippetsQuerySchema>;
