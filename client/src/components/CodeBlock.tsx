import { useMemo, useRef, useState, useEffect } from 'react';
import Prism from 'prismjs';
import { Copy, Check } from 'lucide-react';

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

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  showCopyButton = true,
  maxHeight,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize line splitting
  const lines = useMemo(() => code.split('\n'), [code]);

  // Memoize Prism highlighting
  const highlightedCode = useMemo(() => {
    const grammar = (Prism.languages[language] || Prism.languages.markup) as Prism.Grammar;
    return Prism.highlight(code, grammar, language);
  }, [code, language]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#0f0f10] border border-[var(--border)] ${className}`}>
      {/* Copy button */}
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-[var(--surface-elevated)]/80 hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-[var(--success)]" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Code container */}
      <div 
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <div className="flex">
          {/* Line numbers */}
          {showLineNumbers && (
            <div className="flex-shrink-0 py-4 pl-4 pr-3 text-right select-none bg-[var(--surface-alt)]/50">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className="text-[var(--text-subtle)] font-mono text-sm leading-6"
                  style={{ minWidth: '2rem' }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          {/* Code */}
          <div className="flex-1 py-4 px-4 overflow-x-auto">
            <pre className="m-0 p-0 bg-transparent">
              <code
                className={`language-${language} font-mono text-sm leading-6`}
                style={{
                  fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                  color: '#fafafa',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
