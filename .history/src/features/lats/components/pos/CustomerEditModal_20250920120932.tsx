import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Star, Crown, AlertCircle, CheckCircle, Calendar, Hash, MessageSquare, Users, Gift, CreditCard, Clock, MapPin as LocationIcon, FileText, UserPlus, Award, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Customer } from '../../../customers/types';
import { updateCustomerInDb } from '../../../../lib/customerApi/core';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    gender: 'other',
    city: '',
    locationDescription: '',
    nationalId: '',
    loyaltyLevel: 'bronze',
    colorTag: 'new',
    referralSource: '',
    referredBy: '',
    birthMonth: '',
    birthDay: '',
    initialNotes: '',
    notes: '',
    isActive: true,
    whatsappOptOut: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      const initialData = {
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        whatsapp: customer.whatsapp || '',
        gender: customer.gender || 'other',
        city: customer.city || '',
        locationDescription: customer.locationDescription || '',
        nationalId: customer.nationalId || '',
        loyaltyLevel: customer.loyaltyLevel || 'bronze',
        colorTag: customer.colorTag || 'new',
        referralSource: customer.referralSource || '',
        referredBy: customer.referredBy || '',
        birthMonth: customer.birthMonth || '',
        birthDay: customer.birthDay || '',
        initialNotes: customer.initialNotes || '',
        notes: customer.notes ? (Array.isArray(customer.notes) ? customer.notes.join('\n') : customer.notes) : '',
        isActive: customer.isActive !== false,
        whatsappOptOut: customer.whatsappOptOut || false
      };
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [customer]);

  // Track changes
  useEffect(() => {
    if (customer) {
      const hasFormChanges = 
        formData.name !== (customer.name || '') ||
        formData.phone !== (customer.phone || '') ||
        formData.email !== (customer.email || '') ||
        formData.whatsapp !== (customer.whatsapp || '') ||
        formData.gender !== (customer.gender || 'other') ||
        formData.city !== (customer.city || '') ||
        formData.locationDescription !== (customer.locationDescription || '') ||
        formData.nationalId !== (customer.nationalId || '') ||
        formData.loyaltyLevel !== (customer.loyaltyLevel || 'bronze') ||
        formData.colorTag !== (customer.colorTag || 'new') ||
        formData.referralSource !== (customer.referralSource || '') ||
        formData.referredBy !== (customer.referredBy || '') ||
        formData.birthMonth !== (customer.birthMonth || '') ||
        formData.birthDay !== (customer.birthDay || '') ||
        formData.initialNotes !== (customer.initialNotes || '') ||
        formData.notes !== (customer.notes ? (Array.isArray(customer.notes) ? customer.notes.join('\n') : customer.notes) : '') ||
        formData.isActive !== (customer.isActive !== false) ||
        formData.whatsappOptOut !== (customer.whatsappOptOut || false);
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, customer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !hasChanges) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      // Prepare update data
      const updateData: Partial<Customer> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        loyaltyLevel: formData.loyaltyLevel,
        colorTag: formData.colorTag
      };

      // Handle notes - convert to array if there are notes
      if (formData.notes.trim()) {
        updateData.notes = formData.notes.trim().split('\n').filter(note => note.trim());
      }

      // Update customer in database
      await updateCustomerInDb(customer.id, updateData);

      // Create updated customer object
      const updatedCustomer: Customer = {
        ...customer,
        ...updateData
      };

      // Notify parent component
      onCustomerUpdated(updatedCustomer);

      toast.success('Customer information updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onClose();
  };

  const getLoyaltyIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'platinum':
        return <Crown className="w-4 h-4 text-purple-500" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
      case 'silver':
        return <Star className="w-4 h-4 text-gray-400 fill-current" />;
      case 'bronze':
        return <Star className="w-4 h-4 text-orange-500 fill-current" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  const getColorTagStyle = (colorTag: string) => {
    switch (colorTag) {
      case 'vip':
        return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200';
      case 'premium':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200';
      case 'regular':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200';
      case 'new':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200';
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Customer</h2>
              <p className="text-sm text-gray-600">Update customer information</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Customer Status */}
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                Customer Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loyalty Level
                  </label>
                  <select
                    value={formData.loyaltyLevel}
                    onChange={(e) => handleInputChange('loyaltyLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Tag
                  </label>
                  <select
                    value={formData.colorTag}
                    onChange={(e) => handleInputChange('colorTag', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="new">New Customer</option>
                    <option value="regular">Regular Customer</option>
                    <option value="premium">Premium Customer</option>
                    <option value="vip">VIP Customer</option>
                  </select>
                </div>
              </div>
            </GlassCard>

            {/* Notes */}
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Customer Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Add any notes about this customer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </GlassCard>

            {/* Current Customer Info Display */}
            <GlassCard className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Current Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Points:</span>
                  <span className="ml-2 font-medium">{customer.points || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="ml-2 font-medium">TSh {(customer.totalSpent || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Visit:</span>
                  <span className="ml-2 font-medium">
                    {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Member Since:</span>
                  <span className="ml-2 font-medium">
                    {customer.joinedDate ? new Date(customer.joinedDate).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {hasChanges && <span className="text-orange-600">• You have unsaved changes</span>}
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleClose}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              onClick={handleSubmit}
              disabled={!hasChanges || isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEditModal;
