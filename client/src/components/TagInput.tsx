import { useState, useRef, useEffect } from 'react';
import { Tag, X, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  snippet_count?: number;
}

export interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ selectedTags, onTagsChange, placeholder = 'Add tags...', className }: TagInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const searchTags = async () => {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/tags/autocomplete?q=${encodeURIComponent(query)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          // Filter out already selected tags
          const filtered = data.filter(
            (tag: Tag) => !selectedTags.some((t) => t.id === tag.id)
          );
          setSuggestions(filtered);
        }
      } catch (err) {
        console.error('Failed to search tags:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(searchTags, 300);
    return () => clearTimeout(timeout);
  }, [query, selectedTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: string) => {
    const currentTags = selectedTags || [];
    const newTags = currentTags.filter((t) => t.id !== tagId);
    onTagsChange(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tags = selectedTags || [];
    if (e.key === 'Backspace' && query === '' && tags.length > 0) {
      const tagToRemove = tags[tags.length - 1]; if (tagToRemove) handleRemove(tagToRemove.id)
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected tags */}
      {selectedTags && selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleRemove(tag.id)}
              size="sm"
            />
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className={cn(
            'w-full pl-10 pr-10 py-2 rounded-lg bg-surface-800 border border-surface-700',
            'text-surface-100 placeholder-surface-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 animate-spin" />
        )}
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-surface-800 border border-surface-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelect(tag)}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-sm text-left',
                'hover:bg-surface-700 transition-colors cursor-pointer'
              )}
            >
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tag badge component
export interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagBadge({ tag, onRemove, onClick, size = 'md', className }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
        className
      )}
      style={{ backgroundColor: tag.color + '20', color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
        >
          <X className={cn('w-3 h-3', size === 'sm' && 'w-2.5 h-2.5')} />
        </button>
      )}
    </span>
  );
}

// Tag list display
export interface TagListProps {
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
  className?: string;
}

export function TagList({ tags, onTagClick, className }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onClick={onTagClick ? () => onTagClick(tag) : () => {}}
        />
      ))}
    </div>
  );
}
