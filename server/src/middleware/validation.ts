import { z } from 'zod';

// Language detection patterns - order matters (more specific patterns first)
const languagePatterns: Record<string, RegExp> = {
  // Python - match def statement with parentheses and colon (newline after colon is ok)
  python: /def\s+\w+\s*\([^)]*\):/,
  // PHP - unique opening tag
  php: /\b(<\?php|\$\w+\s*=|echo\s+["'])\b/,
  // HTML - unique doctype or tags (no word boundary before <)
  html: /(<!DOCTYPE\s+html|<html[\s>])/i,
  // CSS - class or id selectors (match .foo{ or #foo{ or .foo { or #foo {)
  css: /[.#]\w+\s*\{/,
  // TypeScript - interfaces and type annotations
  typescript: /\b(interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean)\b)\b/,
  // Java
  java: /\b(public\s+class|private\s+|protected\s+|void\s+\w+\s*\()\b/,
  // Go
  go: /\b(func\s+\w+|package\s+\w+|import\s+\(\s*")\b/,
  // Rust
  rust: /\b(fn\s+\w+|let\s+mut|impl\s+|use\s+\w+::)\b/,
  // Ruby
  ruby: /\b(def\s+\w+\s*$|class\s+\w+\s*<|require\s+['"]|puts\s+)\b/m,
  // Swift
  swift: /\b(func\s+\w+|var\s+\w+|let\s+\w+|import\s+\w+)\b/,
  // Kotlin
  kotlin: /\b(fun\s+\w+|val\s+\w+|var\s+\w+|package\s+\w+)\b/,
  // C#
  csharp: /\b(using\s+\w+|namespace\s+\w+|public\s+class)\b/,
  // SQL
  sql: /\b(SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/i,
  // SCSS
  scss: /\b(@mixin\s+|@include\s+|\$\w+\s*:)\b/,
  // Bash
  bash: /\b(echo\s+|#!\/bin\/bash|#!\/bin\/sh)\b/,
  // PowerShell
  powershell: /\b(Get-|Set-|Write-|\$env:)\b/,
  // Dockerfile
  dockerfile: /\b(FROM\s+|RUN\s+|CMD\s+|EXPOSE\s+)\b/i,
  // YAML
  yaml: /\b(\w+:\s*\n|\s+-\s+\w+:)\b/,
  // JSON
  json: /^\s*(\[|\{).*?(\]|\})\s*$/s,
  // Markdown
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
  tags: z.string().optional(), // Comma-separated list of tag IDs for filtering
  tag_mode: z.enum(['and', 'or']).default('or'), // Filter mode for multiple tags
  sort_by: z.enum(['created_at', 'updated_at', 'title']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
export type ListSnippetsQuery = z.infer<typeof listSnippetsQuerySchema>;
