// Language detection utility
const languagePatterns: Record<string, RegExp> = {
  typescript: /interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|any)\b/,
  javascript: /\b(const|let|var)\b.*\b(function|=>)\b|\b(async|await)\b/,
  python: /\b(def|class)\s+\w+\s*\(|if\s+__name__\s*==\s*['"]__main__['"]/,
  go: /\bfunc\s+\w+\s*\(|package\s+\w+|import\s+\(/,
  rust: /\bfn\s+\w+\s*\(|let\s+mut\s+|impl\s+|struct\s+\w+/,
  java: /\bpublic\s+class\s+|\bprivate\s+|\bprotected\s+|System\.out\./,
  cpp: /#include\s+[<"]|using\s+namespace\s+|std::|cout\s*<</,
  sql: /\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(FROM|INTO|SET)\b|\b(CREATE\s+TABLE|WHERE|JOIN)\b/i,
  html: /<\s*(html|head|body|div|script|style)\b/i,
  css: /@media\s+|@import\s+|padding\s*:|margin\s*:|display\s*:/,
  json: /^\s*\{|^\s*\[/,
  yaml: /^\w+:\s*$|^\s+-\s+\w+:/m,
  bash: /^#!\/bin\/(bash|sh)|\b(echo|cd|ls|pwd|export)\s/,
  markdown: /^#+\s+|^\*\s+|^\d+\.\s+|\[.+\]\(.+\)/m,
  php: /<\?(php)?|\$\w+.*=|function\s+\w+\s*\(/,
  ruby: /\b(def|class)\s+\w+\s*\(|\bend\b|\brequire\b|\bputs\b/,
  swift: /\bfunc\s+\w+\s*\(|\bvar\s+|\blet\s+|\bclass\s+\w+/,
  kotlin: /\bfun\s+\w+\s*\(|\bval\s+|\bvar\s+|\bclass\s+\w+/,
  dart: /\bvoid\s+\w+\s*\(|\bFuture\b|\basync\b|\bawait\b/,
  dockerfile: /^(FROM|RUN|CMD|COPY|ADD|WORKDIR|EXPOSE)\s+/m,
};

const extensionMap: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.sql': 'sql',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.md': 'markdown',
  '.php': 'php',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.dart': 'dart',
  '.dockerfile': 'dockerfile',
  'dockerfile': 'dockerfile',
};

export function detectLanguage(code: string, filename?: string): string {
  // Try to detect from filename extension first
  if (filename) {
    const lowerFilename = filename.toLowerCase();
    
    // Check for Dockerfile (no extension)
    if (lowerFilename === 'dockerfile') {
      return 'dockerfile';
    }
    
    const ext = lowerFilename.match(/\.[^.]+$/)?.[0];
    if (ext && extensionMap[ext]) {
      return extensionMap[ext];
    }
  }

  // Fall back to pattern matching
  for (const [language, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(code)) {
      return language;
    }
  }

  return 'text';
}
