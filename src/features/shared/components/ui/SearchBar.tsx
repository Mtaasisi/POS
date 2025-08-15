import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
  searchKey?: string; // unique key for localStorage
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search by Device ID',
  className = '',
  suggestions = [],
  searchKey = 'default_search',
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSuggestions = query && suggestions.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  // Optimized debounced search for faster response
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        // Use shorter debounce for better responsiveness
        const debounceTime = value.length >= 3 ? 200 : 400;
        timeoutId = setTimeout(() => {
          onSearch(value);
        }, debounceTime);
      };
    })(),
    [onSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowDropdown(false);
  };

  const handleSuggestionClick = (s: string) => {
    setQuery(s);
    onSearch(s);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setShowDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} autoComplete="off">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { /* No dropdown */ }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
          placeholder={placeholder}
          className="
            w-full py-2 sm:py-3 pl-10 sm:pl-12 pr-10 
            bg-white/20 backdrop-blur-md
            border border-white/30 rounded-lg
            text-gray-800 placeholder-gray-500 text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            transition-all duration-300
          "
        />
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          <Search size={18} className="sm:w-5 sm:h-5" />
        </span>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
            aria-label="Clear search"
          >
            &#10005;
          </button>
        )}
        {/* No dropdown for suggestions or recent searches */}
      </div>
    </form>
  );
};

export default SearchBar;