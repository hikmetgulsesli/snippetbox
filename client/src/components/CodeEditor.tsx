import { useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { ChevronDown, FileCode } from 'lucide-react';

// Import Prism languages - markup-templating must be loaded before php
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-dart';

export const languages = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS' },
  { id: 'typescript', name: 'TypeScript', icon: 'TS' },
  { id: 'python', name: 'Python', icon: 'PY' },
  { id: 'java', name: 'Java', icon: 'JV' },
  { id: 'go', name: 'Go', icon: 'GO' },
  { id: 'rust', name: 'Rust', icon: 'RS' },
  { id: 'c', name: 'C', icon: 'C' },
  { id: 'cpp', name: 'C++', icon: 'C++' },
  { id: 'csharp', name: 'C#', icon: 'C#' },
  { id: 'ruby', name: 'Ruby', icon: 'RB' },
  { id: 'php', name: 'PHP', icon: 'PHP' },
  { id: 'swift', name: 'Swift', icon: 'SW' },
  { id: 'kotlin', name: 'Kotlin', icon: 'KT' },
  { id: 'dart', name: 'Dart', icon: 'DT' },
  { id: 'sql', name: 'SQL', icon: 'SQL' },
  { id: 'html', name: 'HTML', icon: 'HTML' },
  { id: 'css', name: 'CSS', icon: 'CSS' },
  { id: 'scss', name: 'SCSS', icon: 'SCSS' },
  { id: 'json', name: 'JSON', icon: 'JSON' },
  { id: 'yaml', name: 'YAML', icon: 'YAML' },
  { id: 'bash', name: 'Bash', icon: 'SH' },
  { id: 'powershell', name: 'PowerShell', icon: 'PS' },
  { id: 'docker', name: 'Dockerfile', icon: 'DOCKER' },
  { id: 'markdown', name: 'Markdown', icon: 'MD' },
  { id: 'text', name: 'Plain Text', icon: 'TXT' },
] as const;

export type LanguageId = typeof languages[number]['id'];

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: LanguageId;
  onLanguageChange?: (language: LanguageId) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  showLanguageSelector?: boolean;
}

// Custom Prism theme using design tokens
const prismStyles = `
  .prism-editor {
    font-family: 'Fira Code', 'Consolas', 'Monaco', 'monospace';
    font-size: 14px;
    line-height: 1.5;
  }
  
  .prism-editor textarea {
    outline: none;
  }
  
  /* Syntax highlighting colors matching DevTool palette */
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #71717a;
    font-style: italic;
  }
  
  .token.punctuation {
    color: #a1a1aa;
  }
  
  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #f472b6;
  }
  
  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #a3e635;
  }
  
  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #22d3ee;
  }
  
  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #22d3ee;
    font-weight: 500;
  }
  
  .token.function,
  .token.class-name {
    color: #60a5fa;
  }
  
  .token.regex,
  .token.important,
  .token.variable {
    color: #fbbf24;
  }
  
  .token.important,
  .token.bold {
    font-weight: bold;
  }
  
  .token.italic {
    font-style: italic;
  }
`;

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  placeholder = '// Enter your code here...',
  readOnly = false,
  minHeight = '200px',
  showLanguageSelector = true,
}: CodeEditorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLanguage = languages.find(l => l.id === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightCode = (code: string) => {
    const grammar = (Prism.languages[language] || Prism.languages.text || Prism.languages.markup) as Prism.Grammar;
    return Prism.highlight(code, grammar, language);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[#0f0f10]">
      <style>{prismStyles}</style>
      
      {/* Toolbar */}
      {showLanguageSelector && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-alt)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">Language:</span>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)] text-sm text-[var(--text)] hover:bg-[var(--surface-card)] transition-colors"
            >
              <span className="font-medium">{selectedLanguage.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 max-h-64 overflow-y-auto rounded-lg bg-[var(--surface-card)] border border-[var(--border)] shadow-lg z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange?.(lang.id as LanguageId);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      language === lang.id
                        ? 'bg-[var(--primary-900)]/30 text-[var(--primary)]'
                        : 'text-[var(--text)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <span className="w-8 h-6 flex items-center justify-center rounded bg-[var(--surface-elevated)] text-xs font-mono">
                      {lang.icon}
                    </span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Editor */}
      <div className="prism-editor" style={{ minHeight }}>
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlightCode}
          padding={16}
          placeholder={placeholder}
          disabled={readOnly}
          className={readOnly ? 'cursor-default' : 'cursor-text'}
          style={{
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            fontSize: 14,
            backgroundColor: '#0f0f10',
            color: '#fafafa',
            minHeight,
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
    </div>
  );
}

// Language detection utility
export function detectLanguageFromExtension(filename: string): LanguageId {
  const ext = filename.toLowerCase().split('.').pop();
  
  const extensionMap: Record<string, LanguageId> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cs': 'csharp',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'sql': 'sql',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sh': 'bash',
    'bash': 'bash',
    'ps1': 'powershell',
    'dockerfile': 'docker',
    'md': 'markdown',
    'txt': 'text',
  };
  
  return extensionMap[ext || ''] || 'text';
}
