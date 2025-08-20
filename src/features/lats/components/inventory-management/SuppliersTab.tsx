import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import { 
  Truck, Plus, Edit, Trash2, Search, Building, 
  CheckCircle, XCircle, Phone, Mail, Globe, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    description: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    payment_terms: '',
    credit_limit: ''
  });

  const countries = [
    { value: 'Kenya', label: 'Kenya' },
    { value: 'Tanzania', label: 'Tanzania' },
    { value: 'Uganda', label: 'Uganda' },
    { value: 'Rwanda', label: 'Rwanda' },
    { value: 'Burundi', label: 'Burundi' },
    { value: 'Ethiopia', label: 'Ethiopia' },
    { value: 'Somalia', label: 'Somalia' },
    { value: 'South Sudan', label: 'South Sudan' },
    { value: 'DR Congo', label: 'DR Congo' },
    { value: 'Other', label: 'Other' }
  ];

  const paymentTerms = [
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 60', label: 'Net 60' },
    { value: 'Net 90', label: 'Net 90' },
    { value: 'Cash on Delivery', label: 'Cash on Delivery' },
    { value: 'Advance Payment', label: 'Advance Payment' },
    { value: 'Other', label: 'Other' }
  ];

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
    setFormData({
      name: '',
      description: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      country: '',
      payment_terms: '',
      credit_limit: ''
    });
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      description: supplier.description || '',
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      website: supplier.website || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      payment_terms: supplier.payment_terms || '',
      credit_limit: supplier.credit_limit?.toString() || ''
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingSupplier) {
        // TODO: Implement update supplier API call
        setSuppliers(prev => prev.map(s => 
          s.id === editingSupplier.id 
            ? { ...s, ...formData, credit_limit: parseFloat(formData.credit_limit) || 0 }
            : s
        ));
        toast.success('Supplier updated successfully');
      } else {
        // TODO: Implement create supplier API call
        const newSupplier: Supplier = {
          id: Date.now().toString(),
          ...formData,
          credit_limit: parseFloat(formData.credit_limit) || 0,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select country</option>
                      {countries.map(country => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formData.payment_terms}
                      onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select terms</option>
                      {paymentTerms.map(term => (
                        <option key={term.value} value={term.value}>
                          {term.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit
                    </label>
                    <input
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <GlassButton
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                  >
                    {isSubmitting ? 'Saving...' : (editingSupplier ? 'Update Supplier' : 'Add Supplier')}
                  </GlassButton>
                  <GlassButton
                    type="button"
                    onClick={() => setShowSupplierForm(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;
