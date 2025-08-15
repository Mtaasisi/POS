import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchService, { SearchResult as ServiceSearchResult } from '../../../lib/searchService';
import {
  Smartphone,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Crown,
  CreditCard,
  TrendingUp,
  Warehouse,
  BarChart3,
  Activity,
  Calendar,
  MessageSquare,
  Settings,
  User,
  Building,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Mail,
  Tag,
  Filter,
  ArrowRight,
  ExternalLink,
  Loader2,
  Search,
  AlertCircle,
} from 'lucide-react';

interface SearchResult extends ServiceSearchResult {
  icon: React.ReactNode;
}

interface SearchResultsProps {
  query: string;
  filter: string;
  onFilterChange: (filter: string) => void;
  userRole: string;
  devices: any[];
  customers: any[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  filter,
  onFilterChange,
  isLoading,
  userRole,
  devices,
  customers,
}) => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize search service
  const searchService = useMemo(() => new SearchService(userRole), [userRole]);

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        const results = await searchService.search(query);
        
        // Add icons to results
        const resultsWithIcons: SearchResult[] = results.map(result => ({
          ...result,
          icon: getIconForType(result.type),
        }));
        
        setSearchResults(resultsWithIcons);
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchService]);

  // Get icon for result type
  const getIconForType = (type: string): React.ReactNode => {
    switch (type) {
      case 'device':
        return <Smartphone size={20} className="text-blue-600" />;
      case 'customer':
        return <Users size={20} className="text-green-600" />;
      case 'product':
        return <Package size={20} className="text-purple-600" />;
      case 'sale':
        return <TrendingUp size={20} className="text-amber-600" />;
      case 'payment':
        return <CreditCard size={20} className="text-emerald-600" />;
      case 'loyalty':
        return <Crown size={20} className="text-yellow-600" />;
      case 'inventory':
        return <Warehouse size={20} className="text-orange-600" />;
      case 'report':
        return <BarChart3 size={20} className="text-indigo-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  };



  // Filter results by type
  const filteredResults = useMemo(() => {
    if (filter === 'all') return searchResults;
    return searchResults.filter(result => result.type === filter);
  }, [searchResults, filter]);

  // Get available filters
  const availableFilters = useMemo(() => {
    const filters = [
      { key: 'all', label: 'All Results', count: searchResults.length }
    ];

    const typeCounts = searchResults.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(typeCounts).forEach(([type, count]) => {
      const labels: Record<string, string> = {
        device: 'Devices',
        customer: 'Customers',
        product: 'Products',
        sale: 'Sales',
        payment: 'Payments',
        loyalty: 'Loyalty',
        inventory: 'Inventory',
        report: 'Reports'
      };
      
      filters.push({
        key: type,
        label: labels[type] || type,
        count
      });
    });

    return filters;
  }, [searchResults]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle size={32} className="text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Search Error</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Search Results for "{query}"
          </h2>
          <p className="text-gray-600">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      {availableFilters.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {availableFilters.map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => onFilterChange(filterOption.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filter === filterOption.key
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90 border border-white/40'
              }`}
            >
              {filterOption.label}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {filterOption.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filteredResults.length > 0 ? (
        <div className="space-y-3">
          {filteredResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/40 hover:bg-white/90 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  {result.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {result.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">{result.subtitle}</p>
                  <p className="text-sm text-gray-500">{result.description}</p>
                  
                  {result.metadata && (
                    <div className="flex items-center gap-4 mt-2">
                      {result.metadata.status && (
                        <span className="text-xs text-gray-500">
                          Status: {result.metadata.status}
                        </span>
                      )}
                      {result.metadata.price && (
                        <span className="text-xs text-gray-500">
                          Price: TZS {result.metadata.price.toLocaleString()}
                        </span>
                      )}
                      {result.metadata.stock && (
                        <span className="text-xs text-gray-500">
                          Stock: {result.metadata.stock}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <ArrowRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Try adjusting your search terms or filters. You can also try searching for different keywords.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
