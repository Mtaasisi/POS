import React, { useState } from 'react';
import { Customer } from '../../types';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import Modal from '../ui/Modal';
import {
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Search,
  Plus,
  X
} from 'lucide-react';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
}

const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  onSelectCustomer,
  onAddCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get recent customers (last 6)
  const recentCustomersToShow = customers.slice(0, 6);

  const handleCustomerSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
    setSearchQuery('');
  };

  const handleAddCustomer = () => {
    onAddCustomer();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Customer</h2>
              <p className="text-gray-600">Choose customer for this sale</p>
            </div>
          </div>
          <TouchOptimizedButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            icon={X}
            className="w-12 h-12 rounded-full"
          >
            Close
          </TouchOptimizedButton>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, phone, or email..."
              className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
            />
            <Search className="w-6 h-6 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Recent Customers */}
        {!searchQuery && recentCustomersToShow.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customers</h3>
            <div className="grid grid-cols-2 gap-4">
              {recentCustomersToShow.map((customer) => (
                <TouchOptimizedButton
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  variant="secondary"
                  size="md"
                  icon={User}
                  className="text-left justify-start"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">{customer.name}</span>
                    <span className="text-xs text-gray-600">{customer.phone}</span>
                  </div>
                </TouchOptimizedButton>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
            {filteredCustomers.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredCustomers.map((customer) => (
                  <TouchOptimizedButton
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    variant="secondary"
                    size="md"
                    icon={User}
                    className="text-left justify-start"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">{customer.name}</span>
                      <span className="text-xs text-gray-600">{customer.phone}</span>
                      {customer.email && (
                        <span className="text-xs text-gray-500">{customer.email}</span>
                      )}
                    </div>
                  </TouchOptimizedButton>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-semibold">No customers found</p>
                <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* Add New Customer */}
        <div className="border-t pt-6">
          <TouchOptimizedButton
            onClick={handleAddCustomer}
            variant="primary"
            size="lg"
            icon={Plus}
            className="w-full"
          >
            Add New Customer
          </TouchOptimizedButton>
        </div>

        {/* Customer Stats */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Customers:</span>
            <span className="font-semibold text-gray-900">{customers.length}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickCustomerModal; 