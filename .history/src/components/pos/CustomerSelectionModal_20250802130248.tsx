import React, { useState, useEffect } from 'react';
import { Customer, CustomerType } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Modal from '../ui/Modal';
import {
  Users,
  User,
  Plus,
  Search,
  CheckCircle,
  X,
  Crown,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Star,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  customerType: CustomerType;
  setCustomerType: (type: CustomerType) => void;
  customers: Customer[];
  onAddCustomer: () => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedCustomer,
  setSelectedCustomer,
  customerType,
  setCustomerType,
  customers,
  onAddCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers.slice(0, 10)); // Show first 10 customers
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 10));
    }
  }, [searchQuery, customers]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    toast.success(`Selected customer: ${customer.name}`);
    onClose();
  };

  const getCustomerTypeIcon = (type: CustomerType) => {
    return type === 'wholesale' ? <Crown className="w-4 h-4 text-yellow-600" /> : <ShoppingBag className="w-4 h-4 text-blue-600" />;
  };

  const getCustomerTypeColor = (type: CustomerType) => {
    return type === 'wholesale' ? 'text-yellow-600 bg-yellow-100' : 'text-blue-600 bg-blue-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Customer"
      size="lg"
    >
      <div className="p-6">
        {/* Customer Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Customer Type
          </label>
          <div className="flex gap-3">
            <GlassButton
              variant={customerType === 'retail' ? 'default' : 'outline'}
              onClick={() => setCustomerType('retail')}
              className="flex-1 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Retail</span>
            </GlassButton>
            <GlassButton
              variant={customerType === 'wholesale' ? 'default' : 'outline'}
              onClick={() => setCustomerType('wholesale')}
              className="flex-1 flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span>Wholesale</span>
            </GlassButton>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search Customers
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or city..."
              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Customer List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
            <GlassButton
              onClick={onAddCustomer}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Customer
            </GlassButton>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-semibold">No customers found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchQuery ? 'Try a different search term' : 'Add your first customer'}
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`p-4 bg-white/90 backdrop-blur-sm border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    selectedCustomer?.id === customer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                          {customer.loyaltyLevel && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customer.loyaltyLevel as CustomerType)}`}>
                              {customer.loyaltyLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{customer.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {customer.totalSpent && customer.totalSpent > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Spent</p>
                          <p className="font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                        </div>
                      )}
                      
                      {selectedCustomer?.id === customer.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Customer Summary */}
        {selectedCustomer && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-blue-800">Selected Customer</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{selectedCustomer.name}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customerType)}`}>
                  {customerType}
                </span>
              </div>
              {selectedCustomer.phone && (
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              )}
              {selectedCustomer.city && (
                <p className="text-sm text-gray-600">{selectedCustomer.city}</p>
              )}
              {selectedCustomer.totalSpent && selectedCustomer.totalSpent > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  Total Spent: {formatCurrency(selectedCustomer.totalSpent)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <GlassButton
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            {selectedCustomer ? 'Confirm Selection' : 'Close'}
          </GlassButton>
          
          {selectedCustomer && (
            <GlassButton
              variant="outline"
              onClick={() => {
                setSelectedCustomer(null);
                toast.success('Customer selection cleared');
              }}
              className="border-2 border-red-200 hover:border-red-300 text-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </GlassButton>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerSelectionModal; 