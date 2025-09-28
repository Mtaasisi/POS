import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MapPin, Star, Crown, AlertCircle, CheckCircle, Calendar, MessageSquare, Users, Gift, CreditCard, Clock, FileText, UserPlus, Award, TrendingUp } from 'lucide-react';
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
    whatsapp: '',
    gender: 'other',
    city: '',
    loyaltyLevel: 'bronze',
    colorTag: 'new',
    referredBy: '',
    birthMonth: '',
    birthDay: '',
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
        whatsapp: customer.whatsapp || '',
        gender: customer.gender || 'other',
        city: customer.city || '',
        loyaltyLevel: customer.loyaltyLevel || 'bronze',
        colorTag: customer.colorTag || 'new',
        referredBy: customer.referredBy || '',
        birthMonth: customer.birthMonth || '',
        birthDay: customer.birthDay || '',
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
        formData.whatsapp !== (customer.whatsapp || '') ||
        formData.gender !== (customer.gender || 'other') ||
        formData.city !== (customer.city || '') ||
        formData.loyaltyLevel !== (customer.loyaltyLevel || 'bronze') ||
        formData.colorTag !== (customer.colorTag || 'new') ||
        formData.referredBy !== (customer.referredBy || '') ||
        formData.birthMonth !== (customer.birthMonth || '') ||
        formData.birthDay !== (customer.birthDay || '') ||
        formData.notes !== (customer.notes ? (Array.isArray(customer.notes) ? customer.notes.join('\n') : customer.notes) : '') ||
        formData.isActive !== (customer.isActive !== false) ||
        formData.whatsappOptOut !== (customer.whatsappOptOut || false);
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, customer]);

  const handleInputChange = (field: string, value: string | boolean) => {
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
        whatsapp: formData.whatsapp.trim(),
        gender: formData.gender,
        city: formData.city.trim(),
        loyaltyLevel: formData.loyaltyLevel,
        colorTag: formData.colorTag,
        referredBy: formData.referredBy.trim(),
        birthMonth: formData.birthMonth.trim(),
        birthDay: formData.birthDay.trim(),
        isActive: formData.isActive,
        whatsappOptOut: formData.whatsappOptOut
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

  // Helper function to check if a field is missing or empty
  const isFieldMissing = (value: string | undefined | null): boolean => {
    return !value || value.trim() === '';
  };

  // Get missing fields for the customer
  const getMissingFields = () => {
    if (!customer) return [];
    
    const missingFields = [];
    
    if (isFieldMissing(customer.whatsapp)) missingFields.push('WhatsApp');
    if (isFieldMissing(customer.city)) missingFields.push('City');
    if (isFieldMissing(customer.referredBy)) missingFields.push('Referred By');
    if (isFieldMissing(customer.birthMonth)) missingFields.push('Birth Month');
    if (isFieldMissing(customer.birthDay)) missingFields.push('Birth Day');
    if (!customer.notes || (Array.isArray(customer.notes) && customer.notes.length === 0)) missingFields.push('Notes');
    
    return missingFields;
  };

  const missingFields = getMissingFields();

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Customer</h2>
              <p className="text-xs text-gray-600">Update customer information</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="space-y-4">
            {/* Missing Information Alert */}
            {missingFields.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <h3 className="font-medium text-orange-800 text-sm">Missing Info</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {missingFields.map((field, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded border border-orange-200"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                Basic Info
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Number
                    {isFieldMissing(customer?.whatsapp) && <AlertCircle className="w-4 h-4 text-orange-500" />}
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+255 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    City
                    {isFieldMissing(customer?.city) && <AlertCircle className="w-4 h-4 text-orange-500" />}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dar es Salaam"
                  />
                </div>
              </div>
            </div>


            {/* Customer Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Crown className="w-4 h-4 text-purple-600" />
                Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Loyalty
                  </label>
                  <select
                    value={formData.loyaltyLevel}
                    onChange={(e) => handleInputChange('loyaltyLevel', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tag
                  </label>
                  <select
                    value={formData.colorTag}
                    onChange={(e) => handleInputChange('colorTag', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="new">New</option>
                    <option value="regular">Regular</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.whatsappOptOut}
                      onChange={(e) => handleInputChange('whatsappOptOut', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-gray-700">No WhatsApp</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Referral Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                Referral
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    Referred By
                    {isFieldMissing(customer?.referredBy) && <AlertCircle className="w-3 h-3 text-orange-500" />}
                  </label>
                  <input
                    type="text"
                    value={formData.referredBy}
                    onChange={(e) => handleInputChange('referredBy', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Customer name or ID"
                  />
                </div>
              </div>
            </div>

            {/* Birth Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-pink-600" />
                Birth
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Month
                    {isFieldMissing(customer?.birthMonth) && <AlertCircle className="w-3 h-3 text-orange-500" />}
                  </label>
                  <select
                    value={formData.birthMonth}
                    onChange={(e) => handleInputChange('birthMonth', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Month</option>
                    <option value="January">Jan</option>
                    <option value="February">Feb</option>
                    <option value="March">Mar</option>
                    <option value="April">Apr</option>
                    <option value="May">May</option>
                    <option value="June">Jun</option>
                    <option value="July">Jul</option>
                    <option value="August">Aug</option>
                    <option value="September">Sep</option>
                    <option value="October">Oct</option>
                    <option value="November">Nov</option>
                    <option value="December">Dec</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Day
                    {isFieldMissing(customer?.birthDay) && <AlertCircle className="w-3 h-3 text-orange-500" />}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.birthDay}
                    onChange={(e) => handleInputChange('birthDay', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="15"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                Notes
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Additional Notes
                  {(!customer?.notes || (Array.isArray(customer.notes) && customer.notes.length === 0)) && <AlertCircle className="w-3 h-3 text-orange-500" />}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Add notes about this customer..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>

            {/* Current Customer Info Display */}
            <GlassCard className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Current Customer Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Points:</span>
                  <span className="font-medium">{customer.points || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-medium">TSh {(customer.totalSpent || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Last Visit:</span>
                  <span className="font-medium">
                    {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-medium">
                    {customer.joinedDate ? new Date(customer.joinedDate).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span className="text-gray-600">Total Purchases:</span>
                  <span className="font-medium">{customer.totalPurchases || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-600">Referrals:</span>
                  <span className="font-medium">{customer.referrals?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Notes:</span>
                  <span className="font-medium">{customer.notes?.length || 0}</span>
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
