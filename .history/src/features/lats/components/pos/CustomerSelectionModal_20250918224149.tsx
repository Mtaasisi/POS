import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Phone, Mail, X, Plus, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Customer } from '../../../customers/types';
import { searchCustomersFast } from '../../../../lib/customerApi';
import { fetchAllCustomersSimple } from '../../../../lib/customerApi/core';
import CreateCustomerModal from './CreateCustomerModal';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer?: Customer | null;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onCustomerSelect,
  selectedCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  // Load all customers on mount
  useEffect(() => {
    if (isOpen) {
      loadAllCustomers();
    }
  }, [isOpen]);

  // Search customers when query changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchCustomers(searchQuery);
      } else {
        // When search is cleared, show all customers
        setCustomers(recentCustomers);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, recentCustomers]);

  const loadAllCustomers = async () => {
    try {
      setLoading(true);
      const result = await fetchAllCustomersSimple();
      if (result && Array.isArray(result)) {
        setRecentCustomers(result);
        setCustomers(result); // Show all customers by default
        console.log(`✅ Loaded ${result.length} customers for selection modal`);
      } else if (result && result.customers) {
        setRecentCustomers(result.customers);
        setCustomers(result.customers); // Show all customers by default
        console.log(`✅ Loaded ${result.customers.length} customers for selection modal`);
      }
    } catch (error) {
      console.error('Error loading all customers:', error);
      // Fallback to recent customers if fetch fails
      try {
        const fallbackResult = await searchCustomersFast('', 1, 100);
        if (fallbackResult && fallbackResult.customers) {
          setRecentCustomers(fallbackResult.customers);
          setCustomers(fallbackResult.customers);
        }
      } catch (fallbackError) {
        console.error('Error loading fallback customers:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Search through more customers for better results
      const result = await searchCustomersFast(query, 1, 200);
      
      if (result && result.customers) {
        setCustomers(result.customers);
      } else if (result && Array.isArray(result)) {
        setCustomers(result);
      } else {
        setError('Failed to search customers');
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setError('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    onClose();
    toast.success(`Selected customer: ${customer.name}`);
  };

  const handleCreateNewCustomer = () => {
    setShowCreateCustomer(true);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    // Add the new customer to the recent customers list
    setRecentCustomers(prev => [newCustomer, ...prev.slice(0, 4)]);
    // Select the newly created customer
    onCustomerSelect(newCustomer);
  };

  const getLoyaltyIcon = (loyaltyLevel: string) => {
    switch (loyaltyLevel?.toLowerCase()) {
      case 'platinum':
        return <Star className="w-4 h-4 text-purple-500 fill-current" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
      case 'silver':
        return <Star className="w-4 h-4 text-gray-400 fill-current" />;
      case 'bronze':
        return <Star className="w-4 h-4 text-orange-500 fill-current" />;
      default:
        return null;
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Customer</h2>
            <p className="text-gray-600 mt-1">Search and select a customer for this sale</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-white/20 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, mobile number, email, city, or any field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-gray-50/30">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Searching customers...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Search Results or All Customers */}
          {customers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {searchQuery ? (
                  <>
                    <Search className="w-5 h-5 text-blue-500" />
                    Search Results ({customers.length})
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 text-green-500" />
                    All Customers ({customers.length})
                  </>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onSelect={handleCustomerSelect}
                    isSelected={selectedCustomer?.id === customer.id}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && !loading && customers.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600 mb-4">
                No customers match your search for "{searchQuery}"
              </p>
              <GlassButton
                onClick={handleCreateNewCustomer}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Customer
              </GlassButton>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCustomer ? (
                <span>Selected: <strong>{selectedCustomer.name}</strong></span>
              ) : (
                <span>No customer selected</span>
              )}
            </div>
            <div className="flex gap-3">
              <GlassButton variant="outline" onClick={onClose}>
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleCreateNewCustomer}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Customer
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};

// Customer Card Component
interface CustomerCardProps {
  customer: Customer;
  onSelect: (customer: Customer) => void;
  isSelected?: boolean;
  searchQuery?: string;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onSelect, isSelected, searchQuery }) => {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Helper function to highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getLoyaltyIcon = (loyaltyLevel: string) => {
    switch (loyaltyLevel?.toLowerCase()) {
      case 'platinum':
        return <Star className="w-4 h-4 text-purple-500 fill-current" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
      case 'silver':
        return <Star className="w-4 h-4 text-gray-400 fill-current" />;
      case 'bronze':
        return <Star className="w-4 h-4 text-orange-500 fill-current" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelect(customer)}
      className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Header with Avatar and Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate text-sm">
              {highlightText(customer.name, searchQuery || '')}
            </h4>
            {getLoyaltyIcon(customer.loyaltyLevel)}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        {customer.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="truncate">{highlightText(customer.phone, searchQuery || '')}</span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3 text-green-500 flex-shrink-0" />
            <span className="truncate">{highlightText(customer.email, searchQuery || '')}</span>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 text-gray-500 flex-shrink-0">📍</span>
            <span className="truncate">{highlightText(customer.city, searchQuery || '')}</span>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {customer.points || 0} pts
        </div>
        <div className="text-xs font-medium text-gray-900">
          {formatMoney(customer.totalSpent || 0)}
        </div>
      </div>
    </div>
  );
};

export default CustomerSelectionModal;
