import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import type { Collection, Tag } from '../types';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
  selectedCollection: string;
  onCollectionChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (value: string[]) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  collections: Collection[];
  tags: Tag[];
  totalResults: number;
  isLoading: boolean;
}

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c', 'cpp',
  'sql', 'html', 'css', 'json', 'yaml', 'bash', 'markdown', 'php',
  'ruby', 'swift', 'kotlin', 'dart', 'docker', 'plaintext'
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Date Modified' },
  { value: 'title', label: 'Title' },
  { value: 'language', label: 'Language' },
];

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedCollection,
  onCollectionChange,
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  collections,
  tags,
  totalResults,
  isLoading,
}: SearchFiltersProps) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Debounce search input
  const debouncedValue = useDebounce(debouncedSearch, 300);

  // Update parent when debounced value changes
  useState(() => {
    if (debouncedValue !== searchQuery) {
      onSearchChange(debouncedValue);
    }
  });

  const handleSearchChange = (value: string) => {
    setDebouncedSearch(value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchChange(debouncedValue);
    }
  };

  const handleLanguageSelect = (lang: string) => {
    onLanguageChange(lang === selectedLanguage ? '' : lang);
    setShowLanguageDropdown(false);
  };

  const handleSortSelect = (sort: string) => {
    onSortChange(sort);
    setShowSortDropdown(false);
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const clearAllFilters = () => {
    setDebouncedSearch('');
    onSearchChange('');
    onLanguageChange('');
    onCollectionChange('');
    onTagsChange([]);
    onSortChange('created_at');
    onSortOrderChange('desc');
  };

  const hasActiveFilters = searchQuery || selectedLanguage || selectedCollection || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={debouncedSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:bg-surface-700 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="text-sm">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showSortDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-surface-800 border border-surface-700 rounded-lg shadow-lg py-1 z-10">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortSelect(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm cursor-pointer transition-colors ${
                    sortBy === option.value
                      ? 'text-primary-400 bg-surface-700'
                      : 'text-surface-300 hover:bg-surface-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <div className="border-t border-surface-700 my-1" />
              <button
                onClick={() => {
                  onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 cursor-pointer transition-colors"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
              : 'bg-surface-800 border border-surface-700 text-surface-300 hover:bg-surface-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary-500 text-white">
              {[selectedLanguage, selectedCollection, ...selectedTags].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-lg bg-surface-800 border border-surface-700 space-y-4">
          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Language</label>
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-200 flex items-center justify-between cursor-pointer"
              >
                <span>{selectedLanguage || 'All Languages'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface-700 border border-surface-600 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      onLanguageChange('');
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-surface-200 hover:bg-surface-600 cursor-pointer"
                  >
                    All Languages
                  </button>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full px-4 py-2 text-left cursor-pointer transition-colors ${
                        selectedLanguage === lang
                          ? 'text-primary-400 bg-surface-600'
                          : 'text-surface-200 hover:bg-surface-600'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Collection Filter */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => onCollectionChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-200 cursor-pointer"
            >
              <option value="">All Collections</option>
              {collections.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'ring-2 ring-offset-2 ring-offset-surface-800'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    ...(selectedTags.includes(tag.id) && { ringColor: tag.color })
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-surface-500">{totalResults} results:</span>
          
          {searchQuery && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-700 text-surface-300 text-sm">
              Search: {searchQuery}
              <button onClick={() => {
                setDebouncedSearch('');
                onSearchChange('');
              }} className="hover:text-surface-100 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedLanguage && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-700 text-surface-300 text-sm">
              {selectedLanguage}
              <button onClick={() => onLanguageChange('')} className="hover:text-surface-100 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedCollection && collections.find(c => c.id === selectedCollection) && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-700 text-surface-300 text-sm">
              {collections.find(c => c.id === selectedCollection)?.name}
              <button onClick={() => onCollectionChange('')} className="hover:text-surface-100 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedTags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
                <button onClick={() => handleTagToggle(tagId)} className="hover:opacity-80 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          
          <button
            onClick={clearAllFilters}
            className="text-sm text-surface-500 hover:text-surface-300 cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
