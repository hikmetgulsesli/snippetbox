import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import { Copy, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Import Prism languages (excluding PHP due to jsdom issues)
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
// Note: PHP disabled due to jsdom compatibility issues
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-docker';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  filename?: string;
}

export function CodeBlock({
  code,
  language = 'text',
  className,
  showLineNumbers = true,
  showCopyButton = true,
  filename,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const prismLanguage = getPrismLanguage(language);
  const lines = code.split('\n');

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden',
        'bg-surface-900 border border-surface-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-800 border-b border-surface-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {filename && (
            <span className="ml-3 text-sm text-surface-400 font-mono">{filename}</span>
          )}
        </div>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
              'transition-colors cursor-pointer',
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="m-0 p-0">
          <code
            ref={codeRef}
            className={cn(
              'language-' + prismLanguage,
              'block font-mono text-sm leading-relaxed',
              'text-surface-100'
            )}
          >
            {showLineNumbers ? (
              <div className="table w-full">
                {lines.map((line, index) => (
                  <div key={index} className="table-row">
                    <span className="table-cell select-none text-right pr-4 pl-4 text-surface-600 w-12">
                      {index + 1}
                    </span>
                    <span className="table-cell whitespace-pre pr-4">
                      {line || ' '}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Map language names to Prism language identifiers
function getPrismLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    go: 'go',
    rust: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    sql: 'sql',
    html: 'markup',
    css: 'css',
    json: 'json',
    yaml: 'yaml',
    bash: 'bash',
    shell: 'bash',
    markdown: 'markdown',
    md: 'markdown',
    php: 'php',
    ruby: 'ruby',
    swift: 'swift',
    kotlin: 'kotlin',
    dart: 'dart',
    docker: 'docker',
    dockerfile: 'docker',
    text: 'text',
  };

  return languageMap[language.toLowerCase()] || 'text';
}
