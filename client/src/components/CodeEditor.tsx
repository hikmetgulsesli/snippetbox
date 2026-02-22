import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
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
import 'prismjs/components/prism-markup'; // HTML
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

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  minHeight?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'text',
  placeholder = 'Enter your code here...',
  className,
  readOnly = false,
  minHeight = '200px',
}: CodeEditorProps) {
  const handleHighlight = (code: string) => {
    const prismLanguage = getPrismLanguage(language);
    if (prismLanguage && Prism.languages[prismLanguage]) {
      return Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
    }
    return code;
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border border-surface-700 overflow-hidden',
        'bg-surface-900 font-mono text-sm',
        className
      )}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={handleHighlight}
        padding={16}
        placeholder={placeholder}
        readOnly={readOnly}
        className="font-mono"
        style={{
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          fontSize: 14,
          minHeight,
          backgroundColor: 'transparent',
        }}
        textareaClassName="focus:outline-none"
      />
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
