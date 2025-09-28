// AddSupplierModal component - Modal for adding new suppliers in Purchase Order page
import React, { useState } from 'react';
import { X, Building, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { SUPPORTED_CURRENCIES } from '../../lats/lib/purchaseOrderUtils';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: (supplier: any) => void;
}

interface SupplierFormData {
  name: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  exchange_rates: string;
  currency: string;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSupplierCreated
}) => {
  const { createSupplier } = useInventoryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Tanzania',
    exchange_rates: '',
    currency: 'TZS'
  });

  const handleInputChange = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create supplier using the inventory store
      const result = await createSupplier({
        ...formData,
        isActive: true
      });

      if (result.ok && result.data) {
        toast.success('Supplier added successfully!');
        onSupplierCreated(result.data);
        onClose();
        // Reset form
        setFormData({
          name: '',
          company_name: '',
          contact_person: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          country: 'Tanzania',
          exchange_rates: '',
          currency: 'TZS'
        });
      } else {
        toast.error(result.message || 'Failed to add supplier');
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to add supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add New Supplier</h2>
                <p className="text-sm text-gray-600">Create a new supplier for purchase orders</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassInput
                  label="Supplier Name"
                  placeholder="Enter supplier name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
                
                <GlassInput
                  label="Company Name"
                  placeholder="Enter company name (optional)"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                />
              </div>

              <GlassInput
                label="Contact Person"
                placeholder="Enter contact person name"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                
                <GlassInput
                  label="Email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  type="email"
                />
              </div>

              <GlassInput
                label="Address"
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassInput
                  label="City"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
                
                <GlassInput
                  label="Country"
                  placeholder="Enter country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </div>

            {/* Business Terms */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Business Terms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Rates</label>
                  <input
                    type="text"
                    value={formData.exchange_rates}
                    onChange={(e) => handleInputChange('exchange_rates', e.target.value)}
                    placeholder="Enter exchange rates (e.g., 1 USD = 150 TZS)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="TZS">🇹🇿 TZS - Tanzanian Shilling</option>
                    <option value="USD">🇺🇸 USD - US Dollar</option>
                    <option value="EUR">🇪🇺 EUR - Euro</option>
                    <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                    <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200">
              <GlassButton
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="w-full py-4 bg-orange-600 text-white hover:bg-orange-700 text-lg font-semibold"
                icon={isSubmitting ? undefined : <Plus size={20} />}
              >
                {isSubmitting ? 'Adding...' : 'Add Supplier'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default AddSupplierModal;

