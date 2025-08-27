import React, { memo } from 'react';
import { Search, User, ChevronRight } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
  selectedCustomerId?: string;
  onSearchChange: (term: string) => void;
  onCustomerSelect: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = memo(({
  customers,
  searchTerm,
  selectedCustomerId,
  onSearchChange,
  onCustomerSelect
}) => {
  return (
    <>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 bg-white shadow-sm text-sm"
        />
      </div>
      
      {/* Customer Count */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{customers.length} customers</span>
      </div>

      {/* Customer List */}
      <div className="divide-y divide-gray-100">
        {customers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <User size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium">No customers found</p>
            <p className="text-xs mt-1">Try adjusting your search terms</p>
          </div>
        ) : (
          customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onCustomerSelect(customer)}
              className={`w-full p-4 pl-8 text-left hover:bg-gray-50 transition-all duration-200 group ${
                selectedCustomerId === customer.id 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-r-4 border-green-500 shadow-sm' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg transition-all duration-200 ${
                  selectedCustomerId === customer.id 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 group-hover:scale-105'
                }`}>
                  {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors text-base">
                    {customer.name || 'Unknown Customer'}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {customer.phone || customer.email || 'No contact info'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Available</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
});

CustomerList.displayName = 'CustomerList';

export default CustomerList;