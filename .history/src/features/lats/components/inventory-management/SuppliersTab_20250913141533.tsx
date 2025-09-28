import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import { 
  Truck, Plus, Edit, Trash2, Search, Building, 
  CheckCircle, XCircle, Phone, Mail, Globe, MapPin,
  RefreshCw, AlertCircle
} from 'lucide-react';

// Country flag mapping
const countryFlags: { [key: string]: string } = {
  TZ: '🇹🇿', AE: '🇦🇪', CN: '🇨🇳', US: '🇺🇸', CA: '🇨🇦', UK: '🇬🇧',
  DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵', IN: '🇮🇳', BR: '🇧🇷', AU: '🇦🇺',
  KE: '🇰🇪', UG: '🇺🇬', RW: '🇷🇼', ET: '🇪🇹', NG: '🇳🇬', ZA: '🇿🇦',
  EG: '🇪🇬', SA: '🇸🇦', TR: '🇹🇷', RU: '🇷🇺', KR: '🇰🇷', SG: '🇸🇬',
  MY: '🇲🇾', TH: '🇹🇭', VN: '🇻🇳', ID: '🇮🇩', PH: '🇵🇭'
};
import { toast } from 'react-hot-toast';
import SupplierForm from '../inventory/SupplierForm';
import { 
  getActiveSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  searchSuppliers,
  type Supplier,
  type CreateSupplierData,
  type UpdateSupplierData
} from '../../../../lib/supplierApi';

const SuppliersTab: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers from database
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveSuppliers();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load suppliers';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Filter suppliers based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers);
      return;
    }

    // Use API search if query is long enough, otherwise filter locally
    if (searchQuery.length >= 3) {
      const performSearch = async () => {
        try {
          const searchResults = await searchSuppliers(searchQuery);
          setFilteredSuppliers(searchResults);
        } catch (err) {
          console.error('Search error:', err);
          // Fallback to local filtering
          const filtered = suppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredSuppliers(filtered);
        }
      };
      performSearch();
    } else {
      // Local filtering for short queries
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [suppliers, searchQuery]);

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteSupplier(supplierId);
      
      // Update local state
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      setFilteredSuppliers(prev => prev.filter(s => s.id !== supplierId));
      
      toast.success('Supplier deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete supplier';
      toast.error(errorMessage);
      console.error('Error deleting supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSupplier = async (data: CreateSupplierData | UpdateSupplierData) => {
    try {
      setIsSubmitting(true);
      
      if (editingSupplier) {
        // Update existing supplier
        const updatedSupplier = await updateSupplier(editingSupplier.id, data as UpdateSupplierData);
        
        // Update local state
        setSuppliers(prev => prev.map(s => 
          s.id === editingSupplier.id ? updatedSupplier : s
        ));
        setFilteredSuppliers(prev => prev.map(s => 
          s.id === editingSupplier.id ? updatedSupplier : s
        ));
        
        toast.success('Supplier updated successfully');
      } else {
        // Create new supplier
        const newSupplier = await createSupplier(data as CreateSupplierData);
        
        // Update local state
        setSuppliers(prev => [...prev, newSupplier]);
        setFilteredSuppliers(prev => [...prev, newSupplier]);
        
        toast.success('Supplier created successfully');
      }
      
      setShowSupplierForm(false);
      setEditingSupplier(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save supplier';
      toast.error(errorMessage);
      console.error('Error saving supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    loadSuppliers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-600" />
            Supplier Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage suppliers and vendor relationships ({filteredSuppliers.length} suppliers)
          </p>
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            New suppliers are automatically set to active
          </p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            onClick={handleRefresh}
            icon={<RefreshCw size={18} />}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            disabled={loading}
          >
            Refresh
          </GlassButton>
          <GlassButton
            onClick={handleAddSupplier}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
          >
            Add Supplier
          </GlassButton>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <GlassCard className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
            <GlassButton
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
              size="sm"
            >
              Dismiss
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard className="p-4">
        <SearchBar
          placeholder="Search suppliers by name, company, contact person, or email..."
          value={searchQuery}
          onChange={setSearchQuery}
          icon={<Search size={18} />}
        />
      </GlassCard>

      {/* Suppliers List */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading suppliers...</span>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search or clear the search field'
                : 'Get started by adding your first supplier'
              }
            </p>
            {!searchQuery && (
              <GlassButton
                onClick={handleAddSupplier}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
              >
                Add First Supplier
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                    {supplier.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      title="Edit supplier"
                      disabled={isSubmitting}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete supplier"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {supplier.company_name && (
                  <p className="text-sm text-gray-600 mb-2 font-medium">{supplier.company_name}</p>
                )}
                
                {supplier.description && (
                  <p className="text-sm text-gray-600 mb-2">{supplier.description}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-500">
                  {supplier.contact_person && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Contact:</span>
                      <span>{supplier.contact_person}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.phone2 && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${supplier.phone2}`} className="text-blue-600 hover:underline">
                        {supplier.phone2} (Alt)
                      </a>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {supplier.website}
                      </a>
                    </div>
                  )}
                  {supplier.city && supplier.country && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {supplier.city}, {countryFlags[supplier.country] || '🌍'} {supplier.country}
                      </span>
                    </div>
                  )}
                  {supplier.currency && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Currency:</span>
                      <span className="bg-blue-100 px-2 py-1 rounded font-medium text-blue-800 flex items-center gap-1">
                        {countryFlags[supplier.country] || '💱'} {supplier.currency}
                      </span>
                    </div>
                  )}
                  {supplier.is_active !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        supplier.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <SupplierForm
              supplier={editingSupplier || undefined}
              onSubmit={handleSubmitSupplier}
              onCancel={() => setShowSupplierForm(false)}
              loading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;
