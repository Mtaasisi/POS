import React, { useState, useEffect } from 'react';
import { Search, Filter, X, MapPin, Calendar } from 'lucide-react';
import InventoryManagementService from '@/features/lats/services/inventoryManagementService';

interface InventorySearchFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    status: string;
    location: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
  isLoading?: boolean;
}

const InventorySearchFilters: React.FC<InventorySearchFiltersProps> = ({
  onFiltersChange,
  isLoading = false
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'returned', label: 'Returned' }
  ];

  useEffect(() => {
    loadAvailableLocations();
  }, []);

  useEffect(() => {
    onFiltersChange({
      search,
      status,
      location,
      dateFrom,
      dateTo
    });
  }, [search, status, location, dateFrom, dateTo, onFiltersChange]);

  const loadAvailableLocations = async () => {
    try {
      const response = await InventoryManagementService.getAvailableLocations();
      if (response.success && response.data) {
        setAvailableLocations(response.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setLocation('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || status || location || dateFrom || dateTo;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by serial number, IMEI, product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="">All Locations</option>
          {availableLocations.map(loc => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Date Range
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {search && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Search: "{search}"
            </span>
          )}
          {status && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Status: {statusOptions.find(s => s.value === status)?.label}
            </span>
          )}
          {location && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Location: {location}
            </span>
          )}
          {dateFrom && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              From: {new Date(dateFrom).toLocaleDateString()}
            </span>
          )}
          {dateTo && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              To: {new Date(dateTo).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default InventorySearchFilters;
