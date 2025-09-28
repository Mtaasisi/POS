import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Star, UserCheck, Tag, SortAsc, Calendar, MessageSquare, ChevronDown, Gift, Users, Loader2 } from 'lucide-react';
import { Customer, LoyaltyLevel } from '../../../types';

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loyaltyFilter: LoyaltyLevel[];
  onLoyaltyFilterChange: (filter: LoyaltyLevel[]) => void;
  statusFilter: Array<'active' | 'inactive'>;
  onStatusFilterChange: (filter: Array<'active' | 'inactive'>) => void;
  tagFilter: string[];
  onTagFilterChange: (filter: string[]) => void;
  referralFilter: string[];
  onReferralFilterChange: (filter: string[]) => void;
  birthdayFilter: boolean;
  onBirthdayFilterChange: (filter: boolean) => void;
  whatsappFilter: boolean;
  onWhatsappFilterChange?: (filter: boolean) => void;
  showInactive: boolean;
  onShowInactiveChange: (show: boolean) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  customers: Customer[];
  searchLoading?: boolean;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchQuery,
  onSearchChange,
  loyaltyFilter,
  onLoyaltyFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  referralFilter,
  onReferralFilterChange,
  birthdayFilter,
  onBirthdayFilterChange,
  whatsappFilter,
  onWhatsappFilterChange,
  showInactive,
  onShowInactiveChange,
  sortBy,
  onSortByChange,
  customers,
  searchLoading = false
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = searchQuery || 
    loyaltyFilter.length > 0 || 
    statusFilter.length > 0 || 
    tagFilter.length > 0 || 
    referralFilter.length > 0 ||
    birthdayFilter ||
    whatsappFilter ||
    showInactive;

  const clearAllFilters = () => {
    onSearchChange('');
    onLoyaltyFilterChange([]);
    onStatusFilterChange([]);
    onTagFilterChange([]);
    onReferralFilterChange([]);
    onBirthdayFilterChange(false);
    if (onWhatsappFilterChange) {
      onWhatsappFilterChange(false);
    }
    onShowInactiveChange(false);
  };

  // Get unique values for dropdowns
  const uniqueTags = Array.from(new Set(
    customers.map(c => c.colorTag).filter(Boolean)
  ));
  
  const uniqueReferralSources = Array.from(new Set(
    customers.map(c => c.referralSource).filter(Boolean)
  ));

  // Calculate today's birthdays
  const todaysBirthdays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();
    
    return customers.filter(customer => {
      if (!customer.birthMonth || !customer.birthDay) return false;
      
      // Convert month name to number
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const customerMonth = monthNames.indexOf(customer.birthMonth.toLowerCase()) + 1;
      
      return customerMonth === currentMonth && parseInt(customer.birthDay) === currentDay;
    });
  }, [customers]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {searchLoading && (
          <Loader2 size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 animate-spin opacity-50" />
        )}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search customers (type at least 2 characters)..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          inputMode="text"
        />
        {searchLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1 text-xs text-gray-300 opacity-40">
              <Loader2 size={8} className="animate-spin" />
              <span>Searching</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              showFilters 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-gray-700"
          >
            <option value="name">Sort by Name</option>
            <option value="recent">Sort by Recent</option>
            <option value="spent">Sort by Spent</option>
            <option value="points">Sort by Points</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loyalty Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Star size={16} className="inline mr-2 text-yellow-500" />
                Loyalty Level
              </label>
              <div className="space-y-2">
                {(['bronze', 'silver', 'gold', 'platinum'] as LoyaltyLevel[]).map(level => (
                  <label key={level} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={loyaltyFilter.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onLoyaltyFilterChange([...loyaltyFilter, level]);
                        } else {
                          onLoyaltyFilterChange(loyaltyFilter.filter(l => l !== level));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <UserCheck size={16} className="inline mr-2 text-green-500" />
                Status
              </label>
              <div className="space-y-2">
                {(['active', 'inactive'] as const).map(status => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onStatusFilterChange([...statusFilter, status]);
                        } else {
                          onStatusFilterChange(statusFilter.filter(s => s !== status));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Tag size={16} className="inline mr-2 text-purple-500" />
                Tags
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueTags.map(tag => (
                  <label key={tag} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={tagFilter.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onTagFilterChange([...tagFilter, tag]);
                        } else {
                          onTagFilterChange(tagFilter.filter(t => t !== tag));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                      {tag}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Filters</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={birthdayFilter}
                  onChange={(e) => onBirthdayFilterChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Calendar size={16} className="text-pink-500" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Has birthday</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => onShowInactiveChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Show inactive only</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerFilters; 