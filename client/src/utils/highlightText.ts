import * as React from 'react';

interface HighlightTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export function HighlightText({ text, highlight, className = '' }: HighlightTextProps) {
  if (!highlight || !highlight.trim()) {
    return React.createElement(React.Fragment, null, text);
  }

  const parts = text.split(new RegExp('(' + escapeRegExp(highlight) + ')', 'gi'));

  return React.createElement(
    'span',
    { className },
    parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase()
        ? React.createElement('mark', { key: i, className: 'bg-yellow-500/30 text-yellow-200 rounded px-0.5' }, part)
        : part
    )
  );
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightCode(code: string, highlight: string): string {
  if (!highlight || !highlight.trim()) {
    return code;
  }

  const escaped = escapeRegExp(highlight);
  const regex = new RegExp('(' + escaped + ')', 'gi');
  return code.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200">$1</mark>');
}
