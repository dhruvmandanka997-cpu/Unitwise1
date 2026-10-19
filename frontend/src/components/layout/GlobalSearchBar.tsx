import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  Loader2,
  BookOpen,
  Globe2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { SearchResponse, SearchResultItem, SearchResultType } from '../../types/search';

interface GlobalSearchBarProps {
  onSelectPlan?: (planId: string) => void;
  onSelectCurriculum?: (curriculumId: string) => void;
  onSelectStandard?: (curriculumId: string, standardId: string) => void;
}

const CATEGORY_CONFIG: Record<
  SearchResultType,
  { label: string; icon: React.FC<{ className?: string }>; badgeClass: string }
> = {
  plan: {
    label: 'Lesson Plans',
    icon: BookOpen,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  curriculum: {
    label: 'Curriculum Frameworks',
    icon: Globe2,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  standard: {
    label: 'Learning Standards',
    icon: CheckCircle2,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  },
  reference: {
    label: 'Reference Materials',
    icon: ExternalLink,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
};

/**
 * Safely renders text with search query highlighted using <mark> tags.
 * Strictly avoids dangerouslySetInnerHTML.
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim() || !text) {
    return <span>{text}</span>;
  }

  const trimmedQuery = query.trim();
  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={index}
            className="bg-[var(--accent)]/25 text-[var(--text)] font-semibold rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSelectPlan,
  onSelectCurriculum,
  onSelectStandard,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const requestCounterRef = useRef<number>(0);

  // Flattened results for easy linear keyboard navigation across groups
  const flattenedResults = useMemo<SearchResultItem[]>(() => {
    if (!results) return [];
    return [
      ...results.results.plan,
      ...results.results.curriculum,
      ...results.results.standard,
      ...results.results.reference,
    ];
  }, [results]);

  // Execute debounced search
  const performSearch = useCallback((searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsLoading(false);
      setSearchError(null);
      setResults(null);
      setActiveIndex(-1);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentReqId = ++requestCounterRef.current;
    setIsLoading(true);
    setSearchError(null);

    api
      .search(trimmed, { limit: 5 }, controller.signal)
      .then((data) => {
        if (currentReqId === requestCounterRef.current) {
          setResults(data);
          setIsLoading(false);
          setActiveIndex(-1);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (currentReqId === requestCounterRef.current) {
          console.error('[GlobalSearch] Fetch failed:', err);
          setSearchError(err.message || 'Unable to load search results. Please retry.');
          setIsLoading(false);
        }
      });
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 250);
  };

  // Clear query and refocus
  const handleClear = () => {
    setQuery('');
    setResults(null);
    setSearchError(null);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Safe navigation action when an item is selected
  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      setActiveIndex(-1);

      if (item.type === 'plan') {
        if (onSelectPlan) {
          onSelectPlan(item.id);
        } else {
          // Fallback route navigation
          window.location.href = `/workspace?planId=${encodeURIComponent(item.id)}`;
        }
      } else if (item.type === 'curriculum') {
        if (onSelectCurriculum) {
          onSelectCurriculum(item.id);
        } else {
          window.location.href = `/directory?curriculumId=${encodeURIComponent(item.id)}`;
        }
      } else if (item.type === 'standard') {
        const curriculumId = item.routeParams?.curriculumId || item.id;
        const standardId = item.routeParams?.standardId || item.id;
        if (onSelectStandard) {
          onSelectStandard(curriculumId, standardId);
        } else {
          window.location.href = `/directory?curriculumId=${encodeURIComponent(curriculumId)}&standardId=${encodeURIComponent(standardId)}`;
        }
      } else if (item.type === 'reference') {
        if (!item.url) return;
        // Strictly validate protocol (http/https only)
        try {
          const parsed = new URL(item.url);
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            window.open(item.url, '_blank', 'noopener,noreferrer');
          } else {
            console.warn('[GlobalSearch] Rejected unsafe URL scheme:', parsed.protocol);
          }
        } catch {
          console.warn('[GlobalSearch] Invalid URL in reference item:', item.url);
        }
      }
    },
    [onSelectPlan, onSelectCurriculum, onSelectStandard]
  );

  // Keyboard navigation & accessibility handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flattenedResults.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % flattenedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flattenedResults.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? flattenedResults.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flattenedResults.length) {
        handleSelectResult(flattenedResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
      } else if (query) {
        handleClear();
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Global shortcut: '/' or Ctrl/Cmd + K focuses search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResultsCount = results?.total ?? 0;
  const hasResults = totalResultsCount > 0;
  const isTyping = query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar (Preserves exact dimensions, rounded corners, icons, and theme) */}
      <div className="relative flex items-center w-full">
        <label htmlFor="global-search-input" className="sr-only">
          Search lessons, topics, curriculum frameworks, standards and references
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]"
        />

        <input
          id="global-search-input"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="global-search-listbox"
          aria-activedescendant={
            activeIndex >= 0 && flattenedResults[activeIndex]
              ? `search-opt-${flattenedResults[activeIndex].id}`
              : undefined
          }
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search lessons, topics, curriculum frameworks..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-12 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] shadow-[var(--shadow-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute right-3 top-2.5 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" aria-label="Searching..." />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search query"
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)] rounded shadow-sm">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Screen-reader polite live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading
          ? 'Searching...'
          : hasResults
          ? `${totalResultsCount} results found for ${query}`
          : isTyping && !isLoading
          ? `No results found for ${query}`
          : ''}
      </div>

      {/* Dropdown Container: High stacking context (z-50) & shadow */}
      {isOpen && (
        <div
          ref={listboxRef}
          id="global-search-listbox"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-2 max-h-[75vh] sm:max-h-[500px] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl z-50 backdrop-blur-xl focus:outline-none transition-all"
        >
          {/* State 1: Error State with Retry Button */}
          {searchError && (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>{searchError}</span>
              </div>
              <button
                type="button"
                onClick={() => performSearch(query)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90 shadow-sm"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* State 2: No Results Found */}
          {!isLoading && !searchError && isTyping && !hasResults && (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-[var(--text)]">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs mx-auto">
                Try searching by lesson plan title, subject, grade level, curriculum board (e.g. CBSE, NGSS), or topic.
              </p>
            </div>
          )}

          {/* State 3: Short query hint or empty idle helper */}
          {!isLoading && !searchError && !isTyping && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-2 px-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>Quick Search Guide</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('Science');
                    performSearch('Science');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-[var(--lavender-soft)] text-[var(--text)] border border-[var(--border)] transition-colors"
                >
                  <span className="font-medium">Science Units</span>
                  <CornerDownLeft className="h-3 w-3 text-[var(--text-muted)]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('CBSE');
                    performSearch('CBSE');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-[var(--lavender-soft)] text-[var(--text)] border border-[var(--border)] transition-colors"
                >
                  <span className="font-medium">CBSE Curriculum</span>
                  <CornerDownLeft className="h-3 w-3 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
          )}

          {/* State 4: Grouped Search Results */}
          {!searchError && hasResults && (
            <div className="space-y-3">
              {(['plan', 'curriculum', 'standard', 'reference'] as SearchResultType[]).map((categoryKey) => {
                const categoryItems = results?.results[categoryKey] || [];
                if (categoryItems.length === 0) return null;

                const categoryMeta = CATEGORY_CONFIG[categoryKey];
                const CategoryIcon = categoryMeta.icon;

                return (
                  <div key={categoryKey} role="group" aria-label={categoryMeta.label} className="pt-1 first:pt-0">
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]/50 mb-1">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span>{categoryMeta.label}</span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-70">
                        {results?.counts[categoryKey] ?? categoryItems.length} found
                      </span>
                    </div>

                    {/* Result Items */}
                    <div className="space-y-0.5">
                      {categoryItems.map((item) => {
                        const globalIndex = flattenedResults.findIndex((r) => r.id === item.id && r.type === item.type);
                        const isSelected = globalIndex === activeIndex;

                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            id={`search-opt-${item.id}`}
                            role="option"
                            aria-selected={isSelected}
                            data-index={globalIndex}
                            onClick={() => handleSelectResult(item)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`group flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[var(--lavender-soft)] ring-1 ring-[var(--accent)] text-[var(--text)]'
                                : 'hover:bg-[var(--surface-hover)] text-[var(--text)]'
                            }`}
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] shrink-0">
                              <CategoryIcon className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs truncate">
                                  <HighlightMatch text={item.title} query={query} />
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${categoryMeta.badgeClass}`}
                                >
                                  {categoryMeta.label.split(' ')[0]}
                                </span>
                              </div>

                              <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                <HighlightMatch text={item.subtitle} query={query} />
                              </p>

                              {item.snippet && (
                                <p className="text-[10px] text-[var(--text-muted)] italic line-clamp-1 mt-0.5 opacity-85">
                                  &ldquo;<HighlightMatch text={item.snippet} query={query} />&rdquo;
                                </p>
                              )}
                            </div>

                            {isSelected && (
                              <div className="hidden sm:flex items-center self-center text-[10px] font-medium text-[var(--accent)] shrink-0">
                                <CornerDownLeft className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
