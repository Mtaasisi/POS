import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Phone, Mail, X, Plus, Star, RefreshCw } from 'lucide-react';
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

  // Add a retry mechanism if no customers are loaded
  useEffect(() => {
    if (isOpen && !loading && customers.length === 0 && recentCustomers.length === 0) {
      console.log('🔄 No customers loaded, retrying...');
      setTimeout(() => {
        loadAllCustomers();
      }, 1000);
    }
  }, [isOpen, loading, customers.length, recentCustomers.length]);

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
      console.log('🔄 Loading all customers for selection modal...');
      
      const result = await fetchAllCustomersSimple();
      console.log('📊 fetchAllCustomersSimple result:', {
        type: typeof result,
        isArray: Array.isArray(result),
        hasCustomers: result && result.customers,
        length: Array.isArray(result) ? result.length : (result?.customers?.length || 0)
      });
      
      if (result && Array.isArray(result)) {
        setRecentCustomers(result);
        setCustomers(result); // Show all customers by default
        console.log(`✅ Loaded ${result.length} customers for selection modal`);
        
        // Debug: Check for customers with missing data
        const customersWithNames = result.filter(c => c.name && c.name.trim());
        const customersWithPhones = result.filter(c => c.phone && c.phone.trim());
        console.log(`📊 Data quality: ${customersWithNames.length}/${result.length} have names, ${customersWithPhones.length}/${result.length} have phones`);
        
      } else if (result && result.customers && Array.isArray(result.customers)) {
        setRecentCustomers(result.customers);
        setCustomers(result.customers); // Show all customers by default
        console.log(`✅ Loaded ${result.customers.length} customers for selection modal`);
        
        // Debug: Check for customers with missing data
        const customersWithNames = result.customers.filter(c => c.name && c.name.trim());
        const customersWithPhones = result.customers.filter(c => c.phone && c.phone.trim());
        console.log(`📊 Data quality: ${customersWithNames.length}/${result.customers.length} have names, ${customersWithPhones.length}/${result.customers.length} have phones`);
        
      } else {
        console.warn('⚠️ Unexpected result format from fetchAllCustomersSimple:', result);
        setRecentCustomers([]);
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error loading all customers:', error);
      setError('Failed to load customers. Please try again.');
      
      // Fallback to recent customers if fetch fails
      try {
        console.log('🔄 Trying fallback search...');
        const fallbackResult = await searchCustomersFast('', 1, 100);
        console.log('📊 Fallback result:', {
          type: typeof fallbackResult,
          hasCustomers: fallbackResult && fallbackResult.customers,
          length: fallbackResult?.customers?.length || 0
        });
        
        if (fallbackResult && fallbackResult.customers && Array.isArray(fallbackResult.customers)) {
          setRecentCustomers(fallbackResult.customers);
          setCustomers(fallbackResult.customers);
          console.log(`✅ Fallback loaded ${fallbackResult.customers.length} customers`);
        } else {
          console.warn('⚠️ Fallback also failed or returned unexpected format');
          setRecentCustomers([]);
          setCustomers([]);
        }
      } catch (fallbackError) {
        console.error('❌ Error loading fallback customers:', fallbackError);
        setRecentCustomers([]);
        setCustomers([]);
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
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed);
          background-clip: content-box;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[95vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-white/30">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Select Customer
            </h2>
            <p className="text-gray-600 mt-1 text-sm">Search and select a customer for this sale</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllCustomers}
              disabled={loading}
              className="p-3 hover:bg-white/60 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
              title="Refresh customers"
            >
              <RefreshCw className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-3 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-shrink-0 p-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-b border-white/30">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="🔍 Search by name, phone, email, city, or any field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/90 shadow-lg transition-all duration-300 text-lg placeholder-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-6 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 custom-scrollbar scroll-smooth">
          {/* Scroll indicators */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-10"></div>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 mt-4 mb-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
              </div>
              <span className="mt-4 text-gray-600 font-medium">Searching customers...</span>
              <div className="mt-2 w-32 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Search Results or All Customers */}
          {customers.length > 0 && (
            <div className="mb-6 mt-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  {searchQuery ? (
                    <>
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Search className="w-6 h-6 text-blue-600" />
                      </div>
                      <span>Search Results</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {customers.length} found
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-green-100 rounded-xl">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <span>All Customers</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {customers.length} total
                      </span>
                    </>
                  )}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
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
            <div className="text-center py-12 mt-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No customers found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No customers match your search for <span className="font-semibold text-blue-600">"{searchQuery}"</span>
              </p>
              <button
                onClick={handleCreateNewCustomer}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create New Customer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/30 bg-gradient-to-r from-gray-50/80 to-blue-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedCustomer ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Selected:</span>
                    <span className="ml-2 font-bold text-gray-900">{selectedCustomer.name}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-600">No customer selected</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewCustomer}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                New Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        onCustomerCreated={handleCustomerCreated}
      />
      </div>
    </>
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
      className={`group p-5 bg-white/80 backdrop-blur-sm rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 ${
        isSelected 
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-4 ring-blue-500/20' 
          : 'border-gray-200 hover:border-blue-400 hover:bg-white/90'
      }`}
    >
      {/* Header with Avatar and Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          {getLoyaltyIcon(customer.loyaltyLevel) && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              {getLoyaltyIcon(customer.loyaltyLevel)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate text-base group-hover:text-blue-600 transition-colors">
            {highlightText(customer.name, searchQuery || '')}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              customer.loyaltyLevel === 'platinum' 
                ? 'bg-purple-100 text-purple-700' 
                : customer.loyaltyLevel === 'gold'
                ? 'bg-yellow-100 text-yellow-700'
                : customer.loyaltyLevel === 'silver'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {customer.loyaltyLevel || 'Bronze'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-4">
        {customer.phone && (
          <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-xl">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">
              {highlightText(customer.phone, searchQuery || '')}
            </span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-3 p-2 bg-green-50/50 rounded-xl">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Mail className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">
              {highlightText(customer.email, searchQuery || '')}
            </span>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center gap-3 p-2 bg-purple-50/50 rounded-xl">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-sm">📍</span>
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">
              {highlightText(customer.city, searchQuery || '')}
            </span>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-100 rounded-lg">
            <Star className="w-3 h-3 text-yellow-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {customer.points || 0} pts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <span className="text-green-600 text-sm">💰</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {formatMoney(customer.totalSpent || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerSelectionModal;
