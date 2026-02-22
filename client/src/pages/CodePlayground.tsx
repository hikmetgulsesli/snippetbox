import { useState } from 'react';
import { CodeEditor, languages, type LanguageId, detectLanguageFromExtension } from '../components/CodeEditor';
import { CodeBlock } from '../components/CodeBlock';
import { FileCode, Sparkles } from 'lucide-react';

const sampleCode = `// Example function with syntax highlighting
function calculateFibonacci(n: number): number {
  if (n <= 1) return n;
  
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    const temp = curr;
    curr = prev + curr;
    prev = temp;
  }
  
  return curr;
}

// Test the function
console.log(calculateFibonacci(10)); // 55`;

export function CodePlayground() {
  const [code, setCode] = useState(sampleCode);
  const [language, setLanguage] = useState<LanguageId>('typescript');
  const [filename, setFilename] = useState('');

  const handleFilenameChange = (value: string) => {
    setFilename(value);
    if (value.includes('.')) {
      const detected = detectLanguageFromExtension(value);
      setLanguage(detected);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-bold text-3xl text-[var(--text)] flex items-center gap-3">
          <FileCode className="w-8 h-8 text-[var(--primary)]" />
          Code Editor & Syntax Highlighting
        </h1>
        <p className="text-[var(--text-muted)] mt-2">
          Syntax highlighting with Prism.js supporting 25+ languages
        </p>
      </div>

      {/* Filename auto-detection */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="font-heading font-bold text-lg text-[var(--text)]">Auto Language Detection</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-[var(--text-muted)] mb-2">Filename (optional)</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              placeholder="e.g., script.ts, main.py, index.js"
              className="input"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm text-[var(--text-muted)] mb-2">Detected Language</label>
            <div className="px-4 py-2.5 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text)]">
              {languages.find(l => l.id === language)?.name || language}
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="card p-6">
        <h2 className="font-heading font-bold text-xl text-[var(--text)] mb-4">Code Editor</h2>
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          onLanguageChange={setLanguage}
          minHeight="300px"
        />
      </div>

      {/* Code Block Preview */}
      <div className="card p-6">
        <h2 className="font-heading font-bold text-xl text-[var(--text)] mb-4">Preview (Read-only)</h2>
        <CodeBlock
          code={code}
          language={language}
          showLineNumbers={true}
          showCopyButton={true}
          maxHeight="400px"
        />
      </div>

      {/* Language Support List */}
      <div className="card p-6">
        <h2 className="font-heading font-bold text-xl text-[var(--text)] mb-4">Supported Languages ({languages.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                language === lang.id
                  ? 'bg-[var(--primary-900)]/30 text-[var(--primary)] border border-[var(--primary)]/30'
                  : 'bg-[var(--surface-alt)] text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text)]'
              }`}
            >
              <span className="w-7 h-5 flex items-center justify-center rounded bg-[var(--surface-elevated)] text-xs font-mono">
                {lang.icon}
              </span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
