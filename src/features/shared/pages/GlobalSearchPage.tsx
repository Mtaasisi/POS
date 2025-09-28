import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDevices } from '../../../context/DevicesContext';
import { useCustomers } from '../../../context/CustomersContext';
import SearchHome from '../components/SearchHome';
import SearchResults from '../components/SearchResults';
import {
  Search,
  X,
  ArrowRight,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'device' | 'customer' | 'product' | 'sale' | 'payment' | 'loyalty' | 'inventory' | 'report';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  metadata?: Record<string, any>;
  priority: number;
}

const GlobalSearchPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Safely access devices context with error handling for HMR
  let devices: any[] = [];
  try {
    const devicesContext = useDevices();
    devices = devicesContext?.devices || [];
  } catch (error) {
    console.warn('Devices context not available during HMR:', error);
  }
  
  const { customers } = useCustomers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Get search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location.search]);

  // Load recent searches from localStorage
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

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    saveSearch(searchQuery);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    navigate('/search');
  };

  // Remove recent search
  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-sm"
            >
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search devices, customers, products, sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm font-medium text-gray-800 placeholder-gray-500 shadow-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!searchQuery ? (
          <SearchHome 
            recentSearches={recentSearches}
            onSearch={setSearchQuery}
            onRemoveSearch={removeRecentSearch}
            userRole={currentUser.role}
          />
        ) : (
          <SearchResults 
            query={searchQuery}
            filter={activeFilter}
            onFilterChange={setActiveFilter}
            userRole={currentUser.role}
            devices={devices}
            customers={customers}
          />
        )}
      </div>
    </div>
  );
};

export default GlobalSearchPage;
