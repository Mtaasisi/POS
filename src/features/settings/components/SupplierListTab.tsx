import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Users, Building, Phone, Mail, MapPin, Plus, Edit, Trash2, 
  Search, Filter, Eye, X, Save, RotateCcw, MessageCircle, 
  Star, UserPlus, Store, Upload, Image as ImageIcon, 
  Globe, CreditCard, Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupplierListTabProps {
  isActive: boolean;
  suppliers: any[];
  loading: boolean;
  searchQuery: string;
  selectedCountry: string;
  showSupplierForm: boolean;
  editingSupplier: any;
  setShowSupplierForm: (show: boolean) => void;
  setEditingSupplier: (supplier: any) => void;
}

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

const SupplierListTab: React.FC<SupplierListTabProps> = ({ 
  isActive,
  suppliers,
  loading,
  searchQuery,
  selectedCountry,
  showSupplierForm,
  editingSupplier,
  setShowSupplierForm,
  setEditingSupplier
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-orange-100 text-orange-600',
      'bg-red-100 text-red-600',
      'bg-yellow-100 text-yellow-600',
      'bg-indigo-100 text-indigo-600',
      'bg-pink-100 text-pink-600'
    ];
    return colors[index % colors.length];
  };

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

  const handleCloseForm = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  const handleSubmitSupplier = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Mock API call
      if (editingSupplier) {
        // Update supplier
        toast.success('Supplier updated successfully');
      } else {
        // Create supplier
        toast.success('Supplier created successfully');
      }
      handleCloseForm();
    } catch (error) {
      toast.error(editingSupplier ? 'Failed to update supplier' : 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        // Mock API call
        toast.success('Supplier deleted successfully');
      } catch (error) {
        toast.error('Failed to delete supplier');
      }
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
          <div className="text-sm text-gray-600">Total Suppliers</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {suppliers.filter(s => s.payment_account_type === 'mobile_money').length}
          </div>
          <div className="text-sm text-gray-600">Mobile Money</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {suppliers.filter(s => s.payment_account_type === 'bank_account').length}
          </div>
          <div className="text-sm text-gray-600">Bank Account</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {new Set(suppliers.map(s => s.country).filter(Boolean)).size}
          </div>
          <div className="text-sm text-gray-600">Countries</div>
        </GlassCard>
      </div>

      {/* Suppliers List */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suppliers Directory</h3>
        <div className="space-y-4">
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No suppliers found</p>
            </div>
          ) : (
            suppliers.map((supplier, index) => (
              <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${getAvatarColor(index)}`}>
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                        {getPaymentBadge(supplier.payment_account_type)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Company:</span>
                          <p className="font-medium">{supplier.company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{supplier.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">City:</span>
                          <p className="font-medium">{supplier.city || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Country:</span>
                          <p className="font-medium">{supplier.country || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {supplier.description && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Description:</span>
                          <p className="text-sm">{supplier.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <GlassButton
                      size="sm"
                      variant="secondary"
                      icon={<Eye size={14} />}
                    >
                      View
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      variant="secondary"
                      icon={<Edit size={14} />}
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setShowSupplierForm(true);
                      }}
                    >
                      Edit
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      variant="secondary"
                      icon={<MessageCircle size={14} />}
                    >
                      Message
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      variant="secondary"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      Delete
                    </GlassButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

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
              {/* Simple form for now - can be enhanced with proper form component */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    defaultValue={editingSupplier?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue={editingSupplier?.company_name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    defaultValue={editingSupplier?.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    defaultValue={editingSupplier?.city || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    defaultValue={editingSupplier?.country || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select country</option>
                    <option value="TZ">Tanzania</option>
                    <option value="CN">China</option>
                    <option value="AE">Dubai (UAE)</option>
                    <option value="US">United States</option>
                    <option value="KE">Kenya</option>
                    <option value="UG">Uganda</option>
                    <option value="RW">Rwanda</option>
                    <option value="BD">Bangladesh</option>
                    <option value="IN">India</option>
                    <option value="PK">Pakistan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    defaultValue={editingSupplier?.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={handleSubmitSupplier}
                  icon={<Save size={16} />}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </GlassButton>
                <GlassButton
                  onClick={handleCloseForm}
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierListTab;
