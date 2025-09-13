import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SearchService, { SearchResult as ServiceSearchResult } from '../../../lib/searchService';
import {
  Search,
  Smartphone,
  Users,
  Package,
  FileText,
  Crown,
  CreditCard,
  TrendingUp,
  Warehouse,
  BarChart3,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';

interface SearchResult extends ServiceSearchResult {
  icon: React.ReactNode;
}

interface SearchDropdownProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  placeholder = "Search devices, customers, products...",
  className = "",
  onClose
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize search service
  const searchService = useMemo(() => new SearchService(currentUser.role), [currentUser.role]);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Get icon for result type
  const getIconForType = (type: string): React.ReactNode => {
    switch (type) {
      case 'device':
        return <Smartphone size={16} className="text-blue-600" />;
      case 'customer':
        return <Users size={16} className="text-green-600" />;
      case 'product':
        return <Package size={16} className="text-purple-600" />;
      case 'sale':
        return <TrendingUp size={16} className="text-amber-600" />;
      case 'payment':
        return <CreditCard size={16} className="text-emerald-600" />;
      case 'loyalty':
        return <Crown size={16} className="text-yellow-600" />;
      case 'inventory':
        return <Warehouse size={16} className="text-orange-600" />;
      case 'report':
        return <BarChart3 size={16} className="text-indigo-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  // Get quick suggestions based on user role
  const getQuickSuggestions = () => {
    const suggestions = [
      { label: 'Active Devices', query: 'status:active', icon: <Smartphone size={16} />, color: 'blue' },
      { label: 'New Customers', query: 'isRead:false', icon: <Users size={16} />, color: 'green' },
      { label: 'Overdue Devices', query: 'overdue:true', icon: <Clock size={16} />, color: 'red' }
    ];

    if (currentUser.role === 'admin' || currentUser.role === 'customer-care') {
      suggestions.push(
        { label: 'All Products', query: 'type:product', icon: <Package size={16} />, color: 'purple' },
        { label: 'Recent Sales', query: 'type:sale', icon: <TrendingUp size={16} />, color: 'amber' }
      );
    }

    if (currentUser.role === 'admin') {
      suggestions.push(
        { label: 'Payment Reports', query: 'type:payment', icon: <CreditCard size={16} />, color: 'emerald' },
        { label: 'Loyalty Members', query: 'type:loyalty', icon: <Crown size={16} />, color: 'yellow' },
        { label: 'Inventory Alerts', query: 'low:stock', icon: <Warehouse size={16} />, color: 'orange' }
      );
    }

    return suggestions;
  };

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSuggestions(true);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setError(null);
      setShowSuggestions(false);
      
      try {
        const results = await searchService.search(searchQuery);
        
        // Add icons to results
        const resultsWithIcons: SearchResult[] = results.map(result => ({
          ...result,
          icon: getIconForType(result.type),
        }));
        
        setSearchResults(resultsWithIcons);
      } catch (err) {
        console.error('Search error:', err);
        // Don't show error for now, just return empty results
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchService]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleResultClick(searchResults[selectedIndex]);
      } else if (searchQuery.trim()) {
        saveSearch(searchQuery);
        // Navigate to full search page
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      onClose?.();
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveSearch(searchQuery);
    navigate(result.url);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    onClose?.();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: { query: string; label: string }) => {
    setSearchQuery(suggestion.query);
    saveSearch(suggestion.query);
  };

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    saveSearch(query);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const quickSuggestions = getQuickSuggestions();

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm font-medium text-gray-800 placeholder-gray-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowSuggestions(true);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 z-50 max-h-96 overflow-hidden">
          {/* Loading State */}
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Searching...</span>
            </div>
          )}



          {/* Search Results */}
          {!isSearching && searchQuery.trim() && searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-gray-100">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{result.title}</h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{result.subtitle}</p>
                    <p className="text-xs text-gray-500 truncate">{result.description}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              ))}
              
              {/* View All Results */}
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    saveSearch(searchQuery);
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <ExternalLink size={16} />
                  View all results
                </button>
              </div>
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <div className="p-4 text-center">
              <Search size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No results found</p>
              <p className="text-gray-500 text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          )}

          {/* Suggestions */}
          {!isSearching && (!searchQuery.trim() || showSuggestions) && (
            <div className="max-h-64 overflow-y-auto">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Recent Searches</h3>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Suggestions */}
              <div className="p-3">
                <h3 className="text-xs font-medium text-gray-500 mb-2">Quick Search</h3>
                <div className="grid grid-cols-1 gap-1">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`p-1 rounded bg-${suggestion.color}-100`}>
                        {React.cloneElement(suggestion.icon, { className: `text-${suggestion.color}-600` })}
                      </div>
                      <span className="text-sm text-gray-700">{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Tips */}
              <div className="p-3 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-500 mb-2">Search Tips</h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">status:active</kbd> to find active devices</p>
                  <p>• Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">brand:apple</kbd> to find Apple products</p>
                  <p>• Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">price:1000-5000</kbd> for price ranges</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
