import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSelector, SUPPORTED_LANGUAGES } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('renders with selected language', () => {
    render(
      <LanguageSelector
        value="javascript"
        onChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <LanguageSelector
        value="javascript"
        onChange={vi.fn()}
      />
    );
    
    const button = screen.getByText('JavaScript');
    fireEvent.click(button);
    
    // Should show some language options
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('calls onChange when language is selected', () => {
    const handleChange = vi.fn();
    render(
      <LanguageSelector
        value="javascript"
        onChange={handleChange}
      />
    );
    
    const button = screen.getByText('JavaScript');
    fireEvent.click(button);
    
    const pythonOption = screen.getByText('Python');
    fireEvent.click(pythonOption);
    
    expect(handleChange).toHaveBeenCalledWith('python');
  });

  it('displays all supported languages', () => {
    render(
      <LanguageSelector
        value="python"
        onChange={vi.fn()}
      />
    );
    
    const button = screen.getByText('Python');
    fireEvent.click(button);
    
    // Check that we have at least 20 languages
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(screen.getAllByText(lang.name)[0]).toBeInTheDocument();
    });
  });

  it('auto-detects language from filename', () => {
    const handleChange = vi.fn();
    render(
      <LanguageSelector
        value=""
        onChange={handleChange}
        autoDetect={true}
        filename="script.py"
      />
    );
    
    // Should detect Python from .py extension
    expect(handleChange).toHaveBeenCalledWith('python');
  });

  it('auto-detects language from code content', () => {
    const handleChange = vi.fn();
    render(
      <LanguageSelector
        value=""
        onChange={handleChange}
        autoDetect={true}
        code="def hello():\n    pass"
      />
    );
    
    // Should detect Python from code pattern
    expect(handleChange).toHaveBeenCalledWith('python');
  });
});
