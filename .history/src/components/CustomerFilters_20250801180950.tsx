import React, { useState } from 'react';
import { Search, Filter, X, Star, UserCheck, Tag, SortAsc } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { Customer, LoyaltyLevel } from '../types';

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
  onWhatsappFilterChange: (filter: boolean) => void;
  showInactive: boolean;
  onShowInactiveChange: (show: boolean) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  customers: Customer[];
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
  customers
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
    onWhatsappFilterChange(false);
    onShowInactiveChange(false);
  };

  // Get unique values for dropdowns
  const uniqueTags = Array.from(new Set(
    customers.map(c => c.colorTag).filter(Boolean)
  ));

  return (
    <GlassCard className="mb-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Filters</h3>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <GlassButton
              variant="secondary"
              size="sm"
              icon={<X size={16} />}
              onClick={clearAllFilters}
            >
              Clear All
            </GlassButton>
          )}
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </GlassButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, email, or city..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Loyalty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star size={16} className="inline mr-1" />
              Loyalty Level
            </label>
            <select
              multiple
              value={loyaltyFilter}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as LoyaltyLevel);
                onLoyaltyFilterChange(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserCheck size={16} className="inline mr-1" />
              Status
            </label>
            <select
              multiple
              value={statusFilter}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as 'active' | 'inactive');
                onStatusFilterChange(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag size={16} className="inline mr-1" />
              Tags
            </label>
            <select
              multiple
              value={tagFilter}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                onTagFilterChange(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Inactive Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Show Inactive Only
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => onShowInactiveChange(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Show customers inactive for 90+ days</span>
            </label>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SortAsc size={16} className="inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="recent">Most Recent</option>
              <option value="spent">Total Spent</option>
              <option value="points">Points</option>
            </select>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default CustomerFilters; 