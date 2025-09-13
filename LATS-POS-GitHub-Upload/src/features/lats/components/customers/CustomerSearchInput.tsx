// CustomerSearchInput component for LATS module
import React, { useState, useRef, useEffect } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';

interface CustomerSearchInputProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: CustomerFilters) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showAdvancedFilters?: boolean;
  autoFocus?: boolean;
}

interface CustomerFilters {
  status?: 'all' | 'active' | 'inactive' | 'vip' | 'premium' | 'regular' | 'new';
  loyaltyProgram?: 'all' | 'enrolled' | 'not_enrolled';
  marketingConsent?: 'all' | 'consented' | 'not_consented';
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

const CustomerSearchInput: React.FC<CustomerSearchInputProps> = ({
  onSearch,
  onFilterChange,
  placeholder = 'Search customers by name, phone, email, or tags...',
  loading = false,
  disabled = false,
  className = '',
  showAdvancedFilters = false,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'all',
    loyaltyProgram: 'all',
    marketingConsent: 'all',
    tags: [],
    dateRange: {
      start: '',
      end: ''
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        onSearch(value.trim());
      } else {
        onSearch('');
      }
    }, 300);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      onSearch('');
    }
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters: CustomerFilters = {
      status: 'all',
      loyaltyProgram: 'all',
      marketingConsent: 'all',
      tags: [],
      dateRange: {
        start: '',
        end: ''
      }
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.loyaltyProgram !== 'all' ||
    filters.marketingConsent !== 'all' ||
    filters.tags.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <GlassInput
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          loading={loading}
          className="pr-20"
          icon={
            <svg className="w-5 h-5 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Clear Button */}
          {query && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              className="w-8 h-8 p-0"
            />
          )}

          {/* Advanced Filters Toggle */}
          {showAdvancedFilters && (
            <GlassButton
              variant={isAdvancedOpen ? "primary" : "ghost"}
              size="sm"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              }
              className="w-8 h-8 p-0"
              title="Advanced filters"
            />
          )}

          {/* Search Button */}
          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => query.trim() && onSearch(query.trim())}
            disabled={disabled || !query.trim()}
            loading={loading}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            className="w-8 h-8 p-0"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && isAdvancedOpen && (
        <div className="p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-lats-text">Advanced Filters</h3>
            {hasActiveFilters && (
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear All
              </GlassButton>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-lats-text-secondary">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-md text-lats-text focus:outline-none focus:ring-2 focus:ring-lats-primary/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="vip">VIP</option>
                <option value="premium">Premium</option>
                <option value="regular">Regular</option>
                <option value="new">New</option>
              </select>
            </div>

            {/* Loyalty Program Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-lats-text-secondary">Loyalty Program</label>
              <select
                value={filters.loyaltyProgram}
                onChange={(e) => handleFilterChange({ loyaltyProgram: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-md text-lats-text focus:outline-none focus:ring-2 focus:ring-lats-primary/50"
              >
                <option value="all">All Customers</option>
                <option value="enrolled">Enrolled</option>
                <option value="not_enrolled">Not Enrolled</option>
              </select>
            </div>

            {/* Marketing Consent Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-lats-text-secondary">Marketing Consent</label>
              <select
                value={filters.marketingConsent}
                onChange={(e) => handleFilterChange({ marketingConsent: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-md text-lats-text focus:outline-none focus:ring-2 focus:ring-lats-primary/50"
              >
                <option value="all">All Customers</option>
                <option value="consented">Consented</option>
                <option value="not_consented">Not Consented</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-lats-text-secondary">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange({ 
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                  className="w-full px-2 py-2 text-xs bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-md text-lats-text focus:outline-none focus:ring-2 focus:ring-lats-primary/50"
                  placeholder="Start"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange({ 
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                  className="w-full px-2 py-2 text-xs bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-md text-lats-text focus:outline-none focus:ring-2 focus:ring-lats-primary/50"
                  placeholder="End"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-lats-glass-border">
              <div className="flex items-center gap-2 text-xs text-lats-text-secondary mb-2">
                Active Filters:
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.status !== 'all' && (
                  <GlassBadge variant="primary" size="xs" onRemove={() => handleFilterChange({ status: 'all' })}>
                    Status: {filters.status}
                  </GlassBadge>
                )}
                {filters.loyaltyProgram !== 'all' && (
                  <GlassBadge variant="primary" size="xs" onRemove={() => handleFilterChange({ loyaltyProgram: 'all' })}>
                    Loyalty: {filters.loyaltyProgram === 'enrolled' ? 'Enrolled' : 'Not Enrolled'}
                  </GlassBadge>
                )}
                {filters.marketingConsent !== 'all' && (
                  <GlassBadge variant="primary" size="xs" onRemove={() => handleFilterChange({ marketingConsent: 'all' })}>
                    Marketing: {filters.marketingConsent === 'consented' ? 'Consented' : 'Not Consented'}
                  </GlassBadge>
                )}
                {filters.dateRange.start && (
                  <GlassBadge variant="primary" size="xs" onRemove={() => handleFilterChange({ 
                    dateRange: { ...filters.dateRange, start: '' }
                  })}>
                    From: {filters.dateRange.start}
                  </GlassBadge>
                )}
                {filters.dateRange.end && (
                  <GlassBadge variant="primary" size="xs" onRemove={() => handleFilterChange({ 
                    dateRange: { ...filters.dateRange, end: '' }
                  })}>
                    To: {filters.dateRange.end}
                  </GlassBadge>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center gap-2">
        {/* Loading Status */}
        {loading && (
          <GlassBadge variant="info" size="sm">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Searching...
          </GlassBadge>
        )}

        {/* Query Length Indicator */}
        {query && !loading && (
          <GlassBadge variant="ghost" size="sm">
            {query.length} characters
          </GlassBadge>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <GlassBadge variant="warning" size="sm">
            {Object.values(filters).filter(v => 
              v !== 'all' && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
            ).length} filters active
          </GlassBadge>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-lats-text-secondary">
        <span className="mr-4">Press <kbd className="px-1 py-0.5 bg-lats-surface/50 rounded text-xs">Enter</kbd> to search</span>
        <span>Press <kbd className="px-1 py-0.5 bg-lats-surface/50 rounded text-xs">Esc</kbd> to clear</span>
      </div>
    </div>
  );
};

// Export with display name for debugging
CustomerSearchInput.displayName = 'CustomerSearchInput';

export default CustomerSearchInput;
