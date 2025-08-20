// Search & Filter Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Search, Filter, Settings, Save, RefreshCw, Zap, Clock, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SearchFilterSettings {
  // Search Settings
  enableSmartSearch: boolean;
  searchDebounceTime: number;
  maxSearchResults: number;
  searchSuggestions: boolean;
  autoComplete: boolean;
  
  // Filter Settings
  defaultFilters: {
    category: string;
    brand: string;
    priceRange: { min: number; max: number };
    stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  };
  
  // Sort Settings
  defaultSortBy: 'name' | 'price' | 'stock' | 'recent' | 'sales';
  defaultSortOrder: 'asc' | 'desc';
  rememberUserPreferences: boolean;
  
  // Search Behavior
  searchInDescription: boolean;
  searchInSKU: boolean;
  searchInBarcode: boolean;

  fuzzySearch: boolean;
  exactMatchPriority: boolean;
  
  // Performance Settings
  searchCacheEnabled: boolean;
  cacheDuration: number;
  maxCacheSize: number;
  preloadPopularItems: boolean;
  
  // Advanced Settings
  searchHistory: boolean;
  maxHistoryItems: number;
  searchAnalytics: boolean;
  highlightSearchTerms: boolean;
  searchTimeout: number;
}

const SearchFilterSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<SearchFilterSettings>({
    defaultValues: {
      enableSmartSearch: true,
      searchDebounceTime: 300,
      maxSearchResults: 50,
      searchSuggestions: true,
      autoComplete: true,
      defaultFilters: {
        category: '',
        brand: '',
        priceRange: { min: 0, max: 1000000 },
        stockStatus: 'all'
      },
      defaultSortBy: 'sales',
      defaultSortOrder: 'asc',
      rememberUserPreferences: true,
      searchInDescription: true,
      searchInSKU: true,
      searchInBarcode: true,
      searchInTags: false,
      fuzzySearch: true,
      exactMatchPriority: true,
      searchCacheEnabled: true,
      cacheDuration: 300000, // 5 minutes
      maxCacheSize: 1000,
      preloadPopularItems: true,
      searchHistory: true,
      maxHistoryItems: 20,
      searchAnalytics: false,
      highlightSearchTerms: true,
      searchTimeout: 5000
    }
  });

  const watchedValues = watch();

  // Load current settings
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-search-filter-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading search filter settings:', error);
      toast.error('Failed to load search filter settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (data: SearchFilterSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-search-filter-settings', JSON.stringify(data));
      toast.success('Search filter settings saved successfully');
    } catch (error) {
      console.error('Error saving search filter settings:', error);
      toast.error('Failed to save search filter settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    reset({
      enableSmartSearch: true,
      searchDebounceTime: 300,
      maxSearchResults: 50,
      searchSuggestions: true,
      autoComplete: true,
      defaultFilters: {
        category: '',
        brand: '',
        priceRange: { min: 0, max: 1000000 },
        stockStatus: 'all'
      },
      defaultSortBy: 'name',
      defaultSortOrder: 'asc',
      rememberUserPreferences: true,
      searchInDescription: true,
      searchInSKU: true,
      searchInBarcode: true,
      searchInTags: false,
      fuzzySearch: true,
      exactMatchPriority: true,
      searchCacheEnabled: true,
      cacheDuration: 300000,
      maxCacheSize: 1000,
      preloadPopularItems: true,
      searchHistory: true,
      maxHistoryItems: 20,
      searchAnalytics: false,
      highlightSearchTerms: true,
      searchTimeout: 5000
    });
    toast.success('Search filter settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading search filter settings...</span>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Search className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Search & Filter Settings</h2>
          <p className="text-sm text-gray-600">Configure search behavior and filtering options</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
        {/* Search Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Smart Search</div>
                <div className="text-sm text-gray-600">Enable intelligent search with suggestions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableSmartSearch')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search Suggestions</div>
                <div className="text-sm text-gray-600">Show search suggestions as you type</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchSuggestions')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Debounce Time (ms)</label>
              <input
                type="number"
                {...register('searchDebounceTime', { min: 100, max: 2000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                max="2000"
              />
              <p className="text-xs text-gray-500 mt-1">Delay before executing search</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Search Results</label>
              <input
                type="number"
                {...register('maxSearchResults', { min: 10, max: 200 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="10"
                max="200"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of search results to display</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Complete</div>
                <div className="text-sm text-gray-600">Enable auto-completion for search</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoComplete')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Filter Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Sort By</label>
              <select
                {...register('defaultSortBy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="recent">Recently Added</option>
                                        <option value="sales">Most Selling</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Sort Order</label>
              <select
                {...register('defaultSortOrder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Remember User Preferences</div>
                <div className="text-sm text-gray-600">Save user's filter and sort preferences</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberUserPreferences')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Search Behavior */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Search Behavior
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search in Description</div>
                <div className="text-sm text-gray-600">Include product descriptions in search</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchInDescription')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search in SKU</div>
                <div className="text-sm text-gray-600">Include SKU codes in search</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchInSKU')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search in Barcode</div>
                <div className="text-sm text-gray-600">Include barcode numbers in search</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchInBarcode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>



            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Fuzzy Search</div>
                <div className="text-sm text-gray-600">Allow approximate matches</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('fuzzySearch')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Exact Match Priority</div>
                <div className="text-sm text-gray-600">Prioritize exact matches in results</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('exactMatchPriority')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search Cache</div>
                <div className="text-sm text-gray-600">Enable search result caching</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchCacheEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Preload Popular Items</div>
                <div className="text-sm text-gray-600">Preload frequently searched items</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('preloadPopularItems')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cache Duration (ms)</label>
              <input
                type="number"
                {...register('cacheDuration', { min: 60000, max: 3600000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="60000"
                max="3600000"
              />
              <p className="text-xs text-gray-500 mt-1">How long to cache search results</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Cache Size</label>
              <input
                type="number"
                {...register('maxCacheSize', { min: 100, max: 10000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                max="10000"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of cached searches</p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search History</div>
                <div className="text-sm text-gray-600">Save user search history</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchHistory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Search Analytics</div>
                <div className="text-sm text-gray-600">Track search patterns and analytics</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('searchAnalytics')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Highlight Search Terms</div>
                <div className="text-sm text-gray-600">Highlight matching terms in results</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('highlightSearchTerms')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max History Items</label>
              <input
                type="number"
                {...register('maxHistoryItems', { min: 5, max: 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum items in search history</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Timeout (ms)</label>
              <input
                type="number"
                {...register('searchTimeout', { min: 1000, max: 30000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                max="30000"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum time to wait for search results</p>
            </div>
          </div>
        </div>

        {/* Actions - Save button removed, will use unified save button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleReset}
              variant="secondary"
            >
              Reset to Defaults
            </GlassButton>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 italic">
              Settings will be saved using the unified save button
            </div>
          </div>
        </div>
      </form>
    </GlassCard>
  );
};

export default SearchFilterSettings;
