import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Language {
  id: string;
  name: string;
  extension: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'go', name: 'Go', extension: '.go' },
  { id: 'rust', name: 'Rust', extension: '.rs' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'cpp', name: 'C++', extension: '.cpp' },
  { id: 'c', name: 'C', extension: '.c' },
  { id: 'sql', name: 'SQL', extension: '.sql' },
  { id: 'html', name: 'HTML', extension: '.html' },
  { id: 'css', name: 'CSS', extension: '.css' },
  { id: 'json', name: 'JSON', extension: '.json' },
  { id: 'yaml', name: 'YAML', extension: '.yaml' },
  { id: 'bash', name: 'Bash', extension: '.sh' },
  { id: 'markdown', name: 'Markdown', extension: '.md' },
  { id: 'php', name: 'PHP', extension: '.php' },
  { id: 'ruby', name: 'Ruby', extension: '.rb' },
  { id: 'swift', name: 'Swift', extension: '.swift' },
  { id: 'kotlin', name: 'Kotlin', extension: '.kt' },
  { id: 'dart', name: 'Dart', extension: '.dart' },
  { id: 'docker', name: 'Dockerfile', extension: 'Dockerfile' },
  { id: 'text', name: 'Plain Text', extension: '.txt' },
];

export interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  className?: string;
  autoDetect?: boolean;
  code?: string;
  filename?: string;
}

export function LanguageSelector({
  value,
  onChange,
  className,
  autoDetect = false,
  code,
  filename,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-detect language from filename or code
  useEffect(() => {
    if (autoDetect && !value && (filename || code)) {
      const detected = detectLanguage(filename, code);
      if (detected) {
        onChange(detected);
      }
    }
  }, [autoDetect, filename, code, value, onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.id === value) || SUPPORTED_LANGUAGES[0];

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between gap-2 w-full px-3 py-2',
          'bg-surface-800 border border-surface-700 rounded-lg',
          'text-sm text-surface-100',
          'hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
          'transition-colors cursor-pointer'
        )}
      >
        <span>{selectedLanguage.name}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-surface-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 py-1',
            'bg-surface-800 border border-surface-700 rounded-lg',
            'shadow-lg max-h-60 overflow-auto'
          )}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.id}
              type="button"
              onClick={() => {
                onChange(language.id);
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2',
                'text-sm text-left',
                'hover:bg-surface-700 transition-colors cursor-pointer',
                value === language.id && 'bg-primary-500/20 text-primary-400'
              )}
            >
              <div className="flex items-center gap-2">
                <span>{language.name}</span>
                <span className="text-xs text-surface-500">{language.extension}</span>
              </div>
              {value === language.id && (
                <Check className="w-4 h-4 text-primary-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Language detection from filename or code
function detectLanguage(filename?: string, code?: string): string | null {
  // Try filename extension first
  if (filename) {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext) {
      const lang = SUPPORTED_LANGUAGES.find((l) => l.extension.toLowerCase() === ext);
      if (lang) return lang.id;
    }
    // Check for Dockerfile
    if (filename.toLowerCase() === 'dockerfile') {
      return 'docker';
    }
  }

  // Try code patterns
  if (code) {
    const patterns: Record<string, RegExp> = {
      typescript: /\b(interface|type\s+\w+|:\s*(string|number|boolean|any)\b)/,
      python: /\b(def|class)\s+\w+\s*\(|if\s+__name__\s*==/,
      go: /\bfunc\s+\w+\s*\(|package\s+\w+/,
      rust: /\bfn\s+\w+\s*\(|let\s+mut\s+/,
      java: /\bpublic\s+class\s+|System\.out\./,
      cpp: /#include\s+|std::/,
      sql: /\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(FROM|INTO|SET)\b/i,
      html: /<\s*(html|head|body|div|script|style)\b/i,
      css: /@media\s+|padding\s*:|margin\s*:/,
      json: /^\s*\{|^\s*\[/,
      yaml: /^\w+:\s*$/m,
      bash: /^#!\/bin\/(bash|sh)/,
      php: /<\?(php)?/,
      ruby: /\b(def|class)\s+\w+\s*\(|\brequire\b/,
      swift: /\bfunc\s+\w+\s*\(|\bvar\s+|\blet\s+/,
      kotlin: /\bfun\s+\w+\s*\(|\bval\s+/,
      dart: /\bvoid\s+\w+\s*\(|\bFuture\b/,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(code)) {
        return lang;
      }
    }
  }

  return null;
}
