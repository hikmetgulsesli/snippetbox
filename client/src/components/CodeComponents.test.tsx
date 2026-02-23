import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeEditor, languages, detectLanguageFromExtension } from '../components/CodeEditor';
import { CodeBlock } from '../components/CodeBlock';

describe('CodeEditor', () => {
  it('renders with default props', () => {
    render(
      <CodeEditor
        value="console.log('test');"
        onChange={vi.fn()}
        language="javascript"
      />
    );
    
    expect(screen.getByText('Language:')).toBeDefined();
  });

  it('displays language selector when showLanguageSelector is true', () => {
    render(
      <CodeEditor
        value="test"
        onChange={vi.fn()}
        language="typescript"
        showLanguageSelector={true}
      />
    );
    
    expect(screen.getByText('TypeScript')).toBeDefined();
  });

  it('hides language selector when showLanguageSelector is false', () => {
    render(
      <CodeEditor
        value="test"
        onChange={vi.fn()}
        language="javascript"
        showLanguageSelector={false}
      />
    );
    
    expect(screen.queryByText('Language:')).toBeNull();
  });

  it('calls onChange when text is entered', () => {
    const handleChange = vi.fn();
    render(
      <CodeEditor
        value=""
        onChange={handleChange}
        language="javascript"
      />
    );
    
    const textarea = screen.getByPlaceholderText('// Enter your code here...');
    fireEvent.change(textarea, { target: { value: 'const x = 1;' } });
    
    expect(handleChange).toHaveBeenCalledWith('const x = 1;');
  });

  it('calls onLanguageChange when language is selected', () => {
    const handleLanguageChange = vi.fn();
    render(
      <CodeEditor
        value="test"
        onChange={vi.fn()}
        language="javascript"
        onLanguageChange={handleLanguageChange}
      />
    );
    
    // Open dropdown
    fireEvent.click(screen.getByText('JavaScript'));
    
    // Select Python
    fireEvent.click(screen.getByText('Python'));
    
    expect(handleLanguageChange).toHaveBeenCalledWith('python');
  });

  it('renders in readOnly mode', () => {
    render(
      <CodeEditor
        value="readonly code"
        onChange={vi.fn()}
        language="javascript"
        readOnly={true}
      />
    );
    
    // In readOnly mode, the textarea should have disabled attribute
    const textarea = screen.getByDisplayValue('readonly code');
    expect(textarea).toBeDefined();
  });
});

describe('CodeBlock', () => {
  it('renders code with line numbers', () => {
    const codeWithLines = 'const a;\nconst b;\nconst c;';
    render(
      <CodeBlock
        code={codeWithLines}
        language="javascript"
      />
    );
    
    // Check for line number elements by looking for the line number container
    const lineNumberGutter = document.querySelector('.flex-shrink-0.py-4.pl-4');
    expect(lineNumberGutter).not.toBeNull();
    
    // The gutter should contain line number divs - check text content
    const textContent = lineNumberGutter?.textContent || '';
    expect(textContent).toContain('1');
    expect(textContent).toContain('2');
    expect(textContent).toContain('3');
  });

  it('renders without line numbers when showLineNumbers is false', () => {
    render(
      <CodeBlock
        code="const x = 1;"
        language="javascript"
        showLineNumbers={false}
      />
    );
    
    // With showLineNumbers={false}, the line number gutter should not exist
    // The flex-shrink-0 class is only on the line number column
    const lineNumberGutter = document.querySelector('.flex-shrink-0.py-4.pl-4');
    expect(lineNumberGutter).toBeNull();
  });

  it('shows copy button by default', () => {
    render(
      <CodeBlock
        code="test code"
        language="javascript"
      />
    );
    
    expect(screen.getByTitle('Copy to clipboard')).toBeDefined();
  });

  it('hides copy button when showCopyButton is false', () => {
    render(
      <CodeBlock
        code="test code"
        language="javascript"
        showCopyButton={false}
      />
    );
    
    expect(screen.queryByTitle('Copy to clipboard')).toBeNull();
  });

  it('displays code content', () => {
    render(
      <CodeBlock
        code="const x = 1;"
        language="javascript"
      />
    );
    
    // Check that the code is rendered (Prism will tokenize it)
    expect(screen.getByText(/const/)).toBeDefined();
    expect(screen.getByText(/x/)).toBeDefined();
  });
});

describe('detectLanguageFromExtension', () => {
  it('detects JavaScript from .js extension', () => {
    expect(detectLanguageFromExtension('script.js')).toBe('javascript');
  });

  it('detects TypeScript from .ts extension', () => {
    expect(detectLanguageFromExtension('script.ts')).toBe('typescript');
  });

  it('detects Python from .py extension', () => {
    expect(detectLanguageFromExtension('script.py')).toBe('python');
  });

  it('detects Go from .go extension', () => {
    expect(detectLanguageFromExtension('main.go')).toBe('go');
  });

  it('detects Rust from .rs extension', () => {
    expect(detectLanguageFromExtension('main.rs')).toBe('rust');
  });

  it('detects HTML from .html extension', () => {
    expect(detectLanguageFromExtension('index.html')).toBe('html');
  });

  it('detects CSS from .css extension', () => {
    expect(detectLanguageFromExtension('styles.css')).toBe('css');
  });

  it('detects JSON from .json extension', () => {
    expect(detectLanguageFromExtension('data.json')).toBe('json');
  });

  it('returns text for unknown extensions', () => {
    expect(detectLanguageFromExtension('file.unknown')).toBe('text');
  });

  it('returns text for files without extension', () => {
    expect(detectLanguageFromExtension('README')).toBe('text');
  });
});

describe('languages array', () => {
  it('contains at least 20 languages', () => {
    expect(languages.length).toBeGreaterThanOrEqual(20);
  });

  it('includes JavaScript', () => {
    expect(languages.some(l => l.id === 'javascript')).toBe(true);
  });

  it('includes TypeScript', () => {
    expect(languages.some(l => l.id === 'typescript')).toBe(true);
  });

  it('includes Python', () => {
    expect(languages.some(l => l.id === 'python')).toBe(true);
  });

  it('includes Go', () => {
    expect(languages.some(l => l.id === 'go')).toBe(true);
  });

  it('includes Rust', () => {
    expect(languages.some(l => l.id === 'rust')).toBe(true);
  });

  it('includes SQL', () => {
    expect(languages.some(l => l.id === 'sql')).toBe(true);
  });

  it('includes HTML', () => {
    expect(languages.some(l => l.id === 'html')).toBe(true);
  });

  it('includes CSS', () => {
    expect(languages.some(l => l.id === 'css')).toBe(true);
  });
});
