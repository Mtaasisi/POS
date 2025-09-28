import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, Mail, X, Check } from 'lucide-react';
import { Customer } from '../../../types';
import { searchCustomersFast } from '../../../lib/customerApi/search';
import { toast } from 'react-hot-toast';

interface CustomerSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface CustomerSearchResult {
  customer: Customer;
  relevance: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}

const CustomerSearchDropdown: React.FC<CustomerSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = "Search customers by name, phone, or email...",
  className = "",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const result = await searchCustomersFast(query, 1, 20);
      
      if (result && result.customers) {
        const searchResults: CustomerSearchResult[] = result.customers.map(customer => ({
          customer,
          relevance: calculateRelevance(customer, query),
          matchType: 'partial'
        }));
        
        // Sort by relevance
        searchResults.sort((a, b) => b.relevance - a.relevance);
        setSearchResults(searchResults);
        setIsOpen(true);
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Failed to search customers');
      setSearchResults([]);
      setIsOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateRelevance = (customer: Customer, query: string): number => {
    const searchTerm = query.toLowerCase();
    let relevance = 0;

    // Name match
    if (customer.name.toLowerCase().includes(searchTerm)) {
      relevance += 10;
      if (customer.name.toLowerCase() === searchTerm) {
        relevance += 5;
      }
    }

    // Phone match
    if (customer.phone && customer.phone.includes(searchTerm)) {
      relevance += 8;
    }

    // Email match
    if (customer.email && customer.email.toLowerCase().includes(searchTerm)) {
      relevance += 6;
    }

    return relevance;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleCustomerSelect = (customer: Customer) => {
    const customerDisplayName = customer.name;
    onChange(customerDisplayName);
    setSearchQuery(customerDisplayName);
    setIsOpen(false);
    setSelectedIndex(-1);
    toast.success(`Selected: ${customer.name}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleCustomerSelect(searchResults[selectedIndex].customer);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange('');
    setSearchResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatPhone = (phone: string) => {
    // Simple phone formatting
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery || value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        
        {/* Search/Clear Icon */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchQuery || value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              title="Clear"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          ) : (
            <Search className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result, index) => (
              <div
                key={result.customer.id}
                className={`px-3 py-2 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleCustomerSelect(result.customer)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {result.customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {result.customer.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {result.customer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{formatPhone(result.customer.phone)}</span>
                      </div>
                    )}
                    {result.customer.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{result.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                {index === selectedIndex && (
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
            ))
          ) : searchQuery ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No customers found for "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchDropdown;
