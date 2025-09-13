import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, MapPin, Building, ChevronDown, X } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useFastSupplierSearch } from '../../hooks/useFastSupplierSearch';
import SupplierForm from './SupplierForm';
import { toast } from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface EnhancedSupplierSelectorProps {
  value: string;
  onChange: (supplierId: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showCreateOption?: boolean;
}

const EnhancedSupplierSelector: React.FC<EnhancedSupplierSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select supplier",
  className = "",
  required = false,
  showCreateOption = true
}) => {
  const { suppliers, createSupplier } = useInventoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Use fast supplier search hook
  const {
    searchQuery,
    searchResults,
    search,
    clearSearch,
    getSupplierById,
    totalSuppliers,
    hasResults
  } = useFastSupplierSearch({
    debounceMs: 200,
    maxResults: 20,
    searchFields: ['name', 'contact_person', 'email', 'phone']
  });

  // Get selected supplier
  const selectedSupplier = getSupplierById(value);

  // Handle supplier creation
  const handleCreateSupplier = async (supplierData: any) => {
    try {
      setIsCreating(true);
      const result = await createSupplier(supplierData);
      if (result.ok && result.data) {
        toast.success('Supplier created successfully!');
        setShowSupplierForm(false);
        // Auto-select the newly created supplier
        onChange(result.data.id);
      } else {
        toast.error(result.message || 'Failed to create supplier');
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to create supplier');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle supplier selection
  const handleSelectSupplier = (supplierId: string) => {
    onChange(supplierId);
    setIsOpen(false);
    clearSearch();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-3 px-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-all duration-200 ${
          required && !value ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
        } ${isOpen ? 'border-blue-500 shadow-lg' : 'hover:border-gray-400'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedSupplier ? (
              <>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{selectedSupplier.name}</div>
                  {selectedSupplier.contact_person && (
                    <div className="text-sm text-gray-500 truncate">{selectedSupplier.contact_person}</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => search(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Supplier List */}
          <div className="max-h-60 overflow-y-auto">
            {!hasResults ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No suppliers found' : 'No suppliers available'}
              </div>
            ) : (
              searchResults.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => handleSelectSupplier(supplier.id)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                    value === supplier.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{supplier.name}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {supplier.contact_person && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{supplier.contact_person}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span className="truncate">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Create New Supplier Option */}
          {showCreateOption && (
            <div className="border-t border-gray-100 p-3">
              <button
                type="button"
                onClick={() => setShowSupplierForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Supplier</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Supplier</h2>
              <button
                onClick={() => setShowSupplierForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isCreating}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <SupplierForm
                onSubmit={handleCreateSupplier}
                onClose={() => setShowSupplierForm(false)}
                loading={isCreating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default EnhancedSupplierSelector;
