// SupplierSelectionModal component - For selecting suppliers in purchase orders
import React, { useState, useMemo } from 'react';
import {
  Search, Plus, User, Phone, Mail, MapPin, Building, Truck, 
  Star, Crown, Globe, CreditCard, Calendar, DollarSign,
  CheckCircle, XCircle, RefreshCw, AlertCircle, Factory,
  Store, Coins, Scale, Target, Activity, TrendingUp
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { formatMoney, formatDate } from '../lib/utils';

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  currency?: string;
  isActive: boolean;
  totalSpent?: number;
  ordersCount?: number;
  lastOrderDate?: string;
  rating?: number;
}

interface SupplierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierSelect: (supplier: Supplier) => void;
  suppliers: Supplier[];
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({
  isOpen,
  onClose,
  onSupplierSelect,
  suppliers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'recent' | 'rating'>('name');
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);

  // Get unique countries from suppliers
  const countries = useMemo(() => {
    const countrySet = new Set(suppliers.map(s => s.country).filter(Boolean));
    return Array.from(countrySet).sort();
  }, [suppliers]);

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers.filter(supplier => {
      // Filter by active status
      if (!showInactiveSuppliers && !supplier.isActive) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          (supplier.name?.toLowerCase() || '').includes(query) ||
          (supplier.company_name?.toLowerCase() || '').includes(query) ||
          (supplier.contactPerson?.toLowerCase() || '').includes(query) ||
          (supplier.phone || '').includes(query) ||
          (supplier.email?.toLowerCase() || '').includes(query) ||
          (supplier.city?.toLowerCase() || '').includes(query) ||
          (supplier.country?.toLowerCase() || '').includes(query);
        
        if (!matchesSearch) return false;
      }

      // Filter by country
      if (selectedCountry && supplier.country !== selectedCountry) {
        return false;
      }

      return true;
    });

    // Sort suppliers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'orders':
          return (b.ordersCount || 0) - (a.ordersCount || 0);
        case 'recent':
          const aDate = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          const bDate = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          return bDate - aDate;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [suppliers, searchQuery, selectedCountry, sortBy, showInactiveSuppliers]);



  const getSupplierRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSupplierBadgeColor = (supplier: Supplier) => {
    if (!supplier.isActive) return 'bg-gray-100 text-gray-700';
    if ((supplier.ordersCount || 0) >= 10) return 'bg-purple-100 text-purple-700';
    if ((supplier.rating || 0) >= 4.5) return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getSupplierBadgeText = (supplier: Supplier) => {
    if (!supplier.isActive) return 'Inactive';
    if ((supplier.ordersCount || 0) >= 10) return 'Preferred';
    if ((supplier.rating || 0) >= 4.5) return 'Top Rated';
    return 'Active';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Select Supplier</h2>
                <p className="text-gray-600">Choose a supplier for your purchase order</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search suppliers by name, contact, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Sort by Name</option>
                <option value="orders">Sort by Orders</option>
                <option value="recent">Sort by Recent</option>
                <option value="rating">Sort by Rating</option>
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactiveSuppliers}
                  onChange={(e) => setShowInactiveSuppliers(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">Show inactive suppliers</span>
              </label>
            </div>
            <div className="text-sm text-gray-500">
              {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => onSupplierSelect(supplier)}
                  className="p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-300 cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
                        {supplier.company_name && supplier.company_name !== supplier.name && (
                          <p className="text-sm text-gray-600">{supplier.company_name}</p>
                        )}
                        {supplier.contactPerson && (
                          <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSupplierBadgeColor(supplier)}`}>
                        {getSupplierBadgeText(supplier)}
                      </span>
                      {supplier.rating && (
                        <div className="flex items-center gap-1">
                          <Star className={`w-4 h-4 fill-current ${getSupplierRatingColor(supplier.rating)}`} />
                          <span className={`text-sm font-medium ${getSupplierRatingColor(supplier.rating)}`}>
                            {supplier.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 mb-3">
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {(supplier.city || supplier.country) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Supplier Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Orders</div>
                      <div className="font-semibold text-gray-900">{supplier.ordersCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Currency</div>
                      <div className="font-semibold text-gray-900">{supplier.currency || 'TZS'}</div>
                    </div>
                    {supplier.totalSpent && (
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Total Spent</div>
                        <div className="font-semibold text-green-600">{formatMoney(supplier.totalSpent, { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' })}</div>
                      </div>
                    )}
                    {supplier.lastOrderDate && (
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Last Order</div>
                        <div className="font-semibold text-gray-900">{formatDate(supplier.lastOrderDate)}</div>
                      </div>
                    )}
                    {supplier.paymentTerms && (
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Payment Terms</div>
                        <div className="font-semibold text-gray-900">{supplier.paymentTerms}</div>
                      </div>
                    )}
                    {supplier.leadTimeDays && (
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Lead Time</div>
                        <div className="font-semibold text-gray-900">{supplier.leadTimeDays} days</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCountry 
                  ? "Try adjusting your search criteria or filters" 
                  : "No suppliers available in the system"
                }
              </p>
              <GlassButton
                onClick={() => {
                  // TODO: Navigate to add supplier page
                  onClose();
                }}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-orange-500 to-amber-600 text-white"
              >
                Add New Supplier
              </GlassButton>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredSuppliers.length > 0 
                ? `Select a supplier to continue with your purchase order`
                : `No suppliers match your criteria`
              }
            </div>
            <div className="flex gap-3">
              <GlassButton
                onClick={onClose}
                variant="secondary"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={() => {
                  // TODO: Navigate to add supplier page
                  onClose();
                }}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-orange-500 to-amber-600 text-white"
              >
                Add New Supplier
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SupplierSelectionModal;
