import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';
import SupplierForm from '../components/inventory/SupplierForm';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { 
  Plus, Search, Filter, Edit, Trash2, Phone, Mail, 
  MapPin, Building, Users, RefreshCw, Eye, ArrowLeft, X, Save, RotateCcw
} from 'lucide-react';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { useNavigate } from 'react-router-dom';

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  description?: string;
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  instagram?: string;
  wechat_id?: string;
  city?: string;
  country?: string;
  payment_account_type?: 'mobile_money' | 'bank_account' | 'other';
  mobile_money_account?: string;
  bank_account_number?: string;
  bank_name?: string;
  created_at: string;
  updated_at: string;
}

const SupplierManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    suppliers, 
    loadSuppliers, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    isLoading 
  } = useInventoryStore();

  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = [
    { value: 'all', label: 'All Countries', icon: <MapPin size={16} /> },
    { value: 'CN', label: 'China', icon: <MapPin size={16} /> },
    { value: 'TZ', label: 'Tanzania', icon: <MapPin size={16} /> },
    { value: 'AE', label: 'Dubai (UAE)', icon: <MapPin size={16} /> },
    { value: 'US', label: 'United States', icon: <MapPin size={16} /> },
    { value: 'KE', label: 'Kenya', icon: <MapPin size={16} /> },
    { value: 'UG', label: 'Uganda', icon: <MapPin size={16} /> },
    { value: 'RW', label: 'Rwanda', icon: <MapPin size={16} /> },
    { value: 'BD', label: 'Bangladesh', icon: <MapPin size={16} /> },
    { value: 'IN', label: 'India', icon: <MapPin size={16} /> },
    { value: 'PK', label: 'Pakistan', icon: <MapPin size={16} /> },
    { value: 'other', label: 'Other', icon: <MapPin size={16} /> }
  ];

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery, selectedCountry]);

  const filterSuppliers = () => {
    let filtered = suppliers;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery) ||
        supplier.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by country
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(supplier => supplier.country === selectedCountry);
    }

    setFilteredSuppliers(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateSupplier = async (supplierData: any) => {
    try {
      setIsSubmitting(true);
      await createSupplier(supplierData);
      toast.success('Supplier created successfully');
      setShowSupplierForm(false);
    } catch (error) {
      toast.error('Failed to create supplier');
      console.error('Supplier creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSupplier = async (supplierData: any) => {
    if (!editingSupplier) return;
    
    try {
      setIsSubmitting(true);
      await updateSupplier(editingSupplier.id, supplierData);
      toast.success('Supplier updated successfully');
      setShowSupplierForm(false);
      setEditingSupplier(null);
    } catch (error) {
      toast.error('Failed to update supplier');
      console.error('Supplier update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await deleteSupplier(supplierId);
      toast.success('Supplier deleted successfully');
    } catch (error) {
      toast.error('Failed to delete supplier');
      console.error('Supplier deletion error:', error);
    }
  };

  const startEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleCloseForm = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  const handleSubmitSupplier = async (data: any) => {
    if (editingSupplier) {
      await handleUpdateSupplier(data);
    } else {
      await handleCreateSupplier(data);
    }
  };

  // Generate avatar color based on supplier name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-emerald-500 to-emerald-600',
      'from-orange-500 to-orange-600',
      'from-rose-500 to-rose-600',
      'from-teal-500 to-teal-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-amber-500 to-amber-600',
      'from-cyan-500 to-cyan-600',
      'from-violet-500 to-violet-600',
      'from-sky-500 to-sky-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get payment account type badge
  const getPaymentBadge = (type?: string) => {
    if (!type) return null;
    
    const badgeStyles = {
      mobile_money: 'bg-green-100 text-green-700 border-green-200',
      bank_account: 'bg-blue-100 text-blue-700 border-blue-200',
      other: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeStyles[type as keyof typeof badgeStyles] || badgeStyles.other}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <GlassButton
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </GlassButton>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
              <p className="text-gray-600">Manage suppliers and vendor relationships</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
              <div className="text-sm text-gray-600">Total Suppliers</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{suppliers.filter(s => s.payment_account_type === 'mobile_money').length}</div>
              <div className="text-sm text-gray-600">Mobile Money</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{suppliers.filter(s => s.payment_account_type === 'bank_account').length}</div>
              <div className="text-sm text-gray-600">Bank Account</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{new Set(suppliers.map(s => s.country).filter(Boolean)).size}</div>
              <div className="text-sm text-gray-600">Countries</div>
            </GlassCard>
          </div>

          {/* Controls */}
          <GlassCard className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {countries.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={() => setShowSupplierForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Supplier
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Suppliers Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCountry !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by creating your first supplier'
                }
              </p>
              {!searchQuery && selectedCountry === 'all' && (
                <GlassButton
                  onClick={() => setShowSupplierForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create First Supplier
                </GlassButton>
              )}
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSuppliers.map(supplier => (
                <GlassCard key={supplier.id} className="relative group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {/* Card Header with Gradient Background */}
                  <div className={`h-24 bg-gradient-to-br ${getAvatarColor(supplier.name)} relative overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/20"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-white/20"></div>
                    </div>
                    
                    {/* Supplier Avatar */}
                    <div className="absolute -bottom-8 left-6">
                      <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white ${getAvatarColor(supplier.name).replace('bg-gradient-to-br', 'text')}`}>
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="absolute top-3 right-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg border-2 border-white"></div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="pt-10 pb-4 px-6">
                    {/* Supplier Name and Company */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{supplier.name}</h3>
                      {supplier.company_name && (
                        <p className="text-sm text-gray-600 line-clamp-1">{supplier.company_name}</p>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2 mb-4">
                      {supplier.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone size={14} className="text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.whatsapp && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone size={14} className="text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{supplier.whatsapp}</span>
                        </div>
                      )}
                      {(supplier.city || supplier.country) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin size={14} className="text-purple-600" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            {supplier.city && supplier.country ? `${supplier.city}, ${supplier.country}` : supplier.city || supplier.country}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Payment Type Badge */}
                    {supplier.payment_account_type && (
                      <div className="mb-4">
                        {getPaymentBadge(supplier.payment_account_type)}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Created:</span> {new Date(supplier.created_at).toLocaleDateString()}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => startEdit(supplier)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit Supplier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete Supplier"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Supplier Form Modal */}
          {showSupplierForm && (
            <div 
              className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleCloseForm();
                }
              }}
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6">
                  <SupplierForm
                    supplier={editingSupplier || undefined}
                    onSubmit={handleSubmitSupplier}
                    onClose={handleCloseForm}
                    loading={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default SupplierManagementPage;
