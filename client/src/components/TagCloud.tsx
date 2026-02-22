import { Tag, ChevronRight } from 'lucide-react';
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

export interface TagCloudProps {
  tags: Tag[];
  selectedTags?: string[];
  onTagClick?: (tag: Tag) => void;
  className?: string;
}

export function TagCloud({ tags, selectedTags = [], onTagClick, className }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className="text-center py-4">
        <Tag className="w-8 h-8 text-surface-600 mx-auto mb-2" />
        <p className="text-sm text-surface-500">No tags yet</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        const tagStyle = {
          backgroundColor: isSelected ? tag.color + '30' : tag.color + '15',
          color: tag.color,
        };
        return (
          <button
            key={tag.id}
            onClick={() => onTagClick?.(tag)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'transition-all duration-200 cursor-pointer',
              isSelected
                ? 'ring-2 ring-offset-2 ring-offset-surface-900'
                : 'hover:bg-surface-700'
            )}
            style={isSelected ? { ...tagStyle, '--tw-ring-color': tag.color } as React.CSSProperties : tagStyle}
          >
            <span>{tag.name}</span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isSelected ? 'bg-surface-800/50' : 'bg-surface-700/50'
              )}
            >
              {tag.snippet_count || 0}
            </span>
            {isSelected && (
              <ChevronRight className="w-3 h-3 ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Tag filter component for the snippet list page
export interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagFilter({ tags, selectedTags, onTagsChange, className }: TagFilterProps) {
  const handleTagClick = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-surface-300">Filter by tags</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-surface-500 hover:text-surface-300 transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <button
                key={tagId}
                onClick={() => handleTagClick(tagId)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80"
                style={{ backgroundColor: tag.color + '30', color: tag.color }}
              >
                <span>{tag.name}</span>
                <span className="text-surface-400">×</span>
              </button>
            );
          })}
        </div>
      )}

      <TagCloud
        tags={tags}
        selectedTags={selectedTags}
        onTagClick={(tag) => handleTagClick(tag.id)}
      />
    </div>
  );
}
