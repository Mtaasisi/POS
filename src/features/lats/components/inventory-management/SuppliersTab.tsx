import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import { 
  Truck, Plus, Edit, Trash2, Search, Building, 
  CheckCircle, XCircle, Phone, Mail, Globe, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SupplierForm from '../inventory/SupplierForm';

interface Supplier {
  id: string;
  name: string;
  description?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  payment_terms?: string;
  credit_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierFormData {
  name: string;
  description: string;
  contact_person: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  payment_terms: string;
  credit_limit: string;
}

const SuppliersTab: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);



  // Load suppliers (mock data for now)
  useEffect(() => {
    setLoading(true);
    // TODO: Implement actual API call
    setTimeout(() => {
      setSuppliers([
        {
          id: '1',
          name: 'Tech Solutions Ltd',
          description: 'Leading technology supplier',
          contact_person: 'John Doe',
          email: 'john@techsolutions.com',
          phone: '+254700123456',
          website: 'https://techsolutions.com',
          address: '123 Tech Street',
          city: 'Nairobi',
          country: 'Kenya',
          payment_terms: 'Net 30',
          credit_limit: 50000,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter suppliers based on search
  useEffect(() => {
    let filtered = suppliers;
    
    if (searchQuery) {
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredSuppliers(filtered);
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
    if (!confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      // TODO: Implement delete supplier API call
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      toast.success('Supplier deleted successfully');
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const handleSubmitSupplier = async (data: any) => {
    try {
      if (editingSupplier) {
        // TODO: Implement update supplier API call
        setSuppliers(prev => prev.map(s => 
          s.id === editingSupplier.id 
            ? { ...s, ...data }
            : s
        ));
        toast.success('Supplier updated successfully');
      } else {
        // TODO: Implement create supplier API call
        const newSupplier: Supplier = {
          id: Date.now().toString(),
          ...data,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setSuppliers(prev => [...prev, newSupplier]);
        toast.success('Supplier created successfully');
      }
      
      setShowSupplierForm(false);
    } catch (error) {
      toast.error(editingSupplier ? 'Failed to update supplier' : 'Failed to create supplier');
    }
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
        </div>
        <GlassButton
          onClick={handleAddSupplier}
          icon={<Plus size={18} />}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
        >
          Add Supplier
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <SearchBar
          placeholder="Search suppliers..."
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
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
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
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete supplier"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
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
                      <span>{supplier.city}, {supplier.country}</span>
                    </div>
                  )}
                  {supplier.payment_terms && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Terms:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{supplier.payment_terms}</span>
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
