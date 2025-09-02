// Suppliers Management Page - Manage all suppliers for purchase orders
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';

import {
  Users, Search, Plus, Filter, Edit, Trash2, Eye, Phone, Mail,
  MapPin, Star, TrendingUp, Package, DollarSign, Calendar,
  RefreshCw, CheckCircle, XCircle, AlertCircle, Settings,
  Truck, Coins, Globe, Building, User
} from 'lucide-react';

import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import AddSupplierModal from '../components/AddSupplierModal';
import { Supplier } from '../types';
import { SUPPORTED_CURRENCIES } from '../lib/utils';

const SuppliersManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Inventory store for suppliers
  const {
    suppliers,
    isLoading,
    error,
    loadSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  } = useInventoryStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12;

  // Modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(suppliers.map(s => s.country).filter(Boolean))];
    return uniqueCountries.sort();
  }, [suppliers]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.company_name?.toLowerCase().includes(query) ||
        supplier.contactPerson?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (countryFilter) {
      filtered = filtered.filter(supplier => supplier.country === countryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => 
        statusFilter === 'active' ? supplier.isActive : !supplier.isActive
      );
    }

    return filtered;
  }, [suppliers, searchQuery, countryFilter, statusFilter]);

  // Paginate results
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle supplier actions
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      const result = await deleteSupplier(id);
      if (result.ok) {
        toast.success('Supplier deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete supplier');
      }
    }
  };

  const handleToggleSupplierStatus = async (supplier: Supplier) => {
    const result = await updateSupplier(supplier.id, { isActive: !supplier.isActive });
    if (result.ok) {
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'} successfully`);
    } else {
      toast.error(result.message || 'Failed to update supplier status');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/purchase-orders')} />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Suppliers Management</h1>
                  <p className="text-sm text-gray-600">Manage your supplier network</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={() => setShowAddSupplierModal(true)}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                Add Supplier
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Suppliers</p>
                <p className="text-xl font-semibold text-gray-900">{suppliers.length}</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-semibold text-gray-900">
                  {suppliers.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-xl font-semibold text-gray-900">{countries.length}</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Coins className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Currencies</p>
                <p className="text-xl font-semibold text-gray-900">
                  {[...new Set(suppliers.map(s => s.currency).filter(Boolean))].length}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Package className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Countries</option>
                    {countries.map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCountryFilter('');
                      setStatusFilter('all');
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Suppliers Display */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
              <span className="ml-3 text-gray-600">Loading suppliers...</span>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || countryFilter || statusFilter !== 'all'
                  ? 'No suppliers match your current filters'
                  : 'Add your first supplier to get started'
                }
              </p>
              <GlassButton
                onClick={() => setShowAddSupplierModal(true)}
                icon={<Plus size={20} />}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                Add Supplier
              </GlassButton>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedSuppliers.map((supplier) => (
                  <div key={supplier.id} className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {supplier.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                          {supplier.company_name && (
                            <p className="text-sm text-gray-600">{supplier.company_name}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${supplier.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-600">
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {supplier.contactPerson && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          {supplier.contactPerson}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.country && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {supplier.country}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {supplier.currency && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {supplier.currency}
                          </span>
                        )}
                        {supplier.paymentTerms && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                            {supplier.paymentTerms}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit supplier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleSupplierStatus(supplier)}
                          className={`p-2 rounded-lg transition-colors ${
                            supplier.isActive 
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={supplier.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {supplier.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* List Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4">
                  <div className="font-medium text-gray-700">Supplier</div>
                  <div className="font-medium text-gray-700">Contact</div>
                  <div className="font-medium text-gray-700">Location</div>
                  <div className="font-medium text-gray-700">Terms</div>
                  <div className="font-medium text-gray-700">Status</div>
                  <div className="font-medium text-gray-700">Actions</div>
                </div>
              </div>

              {/* List Body */}
              <div className="divide-y divide-gray-200">
                {paginatedSuppliers.map((supplier) => (
                  <div key={supplier.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            {supplier.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{supplier.name}</div>
                            {supplier.company_name && (
                              <div className="text-sm text-gray-600">{supplier.company_name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="space-y-1">
                          {supplier.contactPerson && (
                            <div className="text-sm text-gray-900">{supplier.contactPerson}</div>
                          )}
                          {supplier.phone && (
                            <div className="text-sm text-gray-600">{supplier.phone}</div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        {supplier.country && (
                          <span className="text-sm text-gray-900">{supplier.country}</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="space-y-1">
                          {supplier.currency && (
                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {supplier.currency}
                            </span>
                          )}
                          {supplier.paymentTerms && (
                            <div className="text-xs text-gray-600">{supplier.paymentTerms}</div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          supplier.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleSupplierStatus(supplier)}
                          className={`p-1 rounded ${
                            supplier.isActive 
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={supplier.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {supplier.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} of {filteredSuppliers.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ‹
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-gray-700">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => setShowAddSupplierModal(false)}
          onSupplierCreated={(newSupplier) => {
            toast.success('Supplier created successfully');
            setShowAddSupplierModal(false);
            loadSuppliers();
          }}
        />
      )}
    </div>
  );
};

export default SuppliersManagementPage;