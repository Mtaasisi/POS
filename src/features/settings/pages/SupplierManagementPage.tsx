import React, { useState, useEffect, useRef, useCallback } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, X, Save, RotateCcw, Tag, Smartphone, Laptop, Monitor, Headphones, Camera, Gamepad2, Printer, Watch, Speaker, Keyboard, Mouse, Router, Server, HardDrive, Package, Eye, MessageCircle, Users, Star, UserPlus, Store, Upload, Image as ImageIcon, Building, Loader2, BarChart3, TrendingUp, Activity, Zap, MapPin, Phone, Mail, Globe, CreditCard, Wallet } from 'lucide-react';
import { 
  Supplier, 
  SupplierCategory,
  createSupplier, 
  updateSupplier, 
  hardDeleteSupplier
} from '../../../lib/supplierApi';
import { useAuth } from '../../../context/AuthContext';
import { useSuppliers } from '../../../context/SuppliersContext';

// Supplier Form Component (Integrated)
interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingSupplier?: Supplier | null;
  isLoading?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSupplier,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    company_name: '',
    description: '',
    contact_person: '',
    email: '',
    phone: '',
    phone2: '',
    whatsapp: '',
    instagram: '',
    wechat_id: '',
    address: '',
    city: '',
    country: '',
    website: '',
    notes: '',
    payment_account_type: '',
    mobile_money_account: '',
    bank_account_number: '',
    bank_name: '',
    is_active: true
  });

  const countryOptions = [
    { value: 'TZ', label: 'Tanzania', icon: '🇹🇿' },
    { value: 'CN', label: 'China', icon: '🇨🇳' },
    { value: 'AE', label: 'Dubai (UAE)', icon: '🇦🇪' },
    { value: 'US', label: 'United States', icon: '🇺🇸' },
    { value: 'KE', label: 'Kenya', icon: '🇰🇪' },
    { value: 'UG', label: 'Uganda', icon: '🇺🇬' },
    { value: 'RW', label: 'Rwanda', icon: '🇷🇼' },
    { value: 'BD', label: 'Bangladesh', icon: '🇧🇩' },
    { value: 'IN', label: 'India', icon: '🇮🇳' },
    { value: 'PK', label: 'Pakistan', icon: '🇵🇰' },
    { value: 'CA', label: 'Canada', icon: '🇨🇦' },
    { value: 'UK', label: 'United Kingdom', icon: '🇬🇧' },
    { value: 'DE', label: 'Germany', icon: '🇩🇪' },
    { value: 'FR', label: 'France', icon: '🇫🇷' },
    { value: 'JP', label: 'Japan', icon: '🇯🇵' },
    { value: 'BR', label: 'Brazil', icon: '🇧🇷' },
    { value: 'AU', label: 'Australia', icon: '🇦🇺' },
    { value: 'other', label: 'Other', icon: '🌍' }
  ];

  const paymentTypeOptions = [
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
    { value: 'bank_account', label: 'Bank Account', icon: '🏦' },
    { value: 'other', label: 'Other', icon: '💳' }
  ];

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name || '',
        company_name: editingSupplier.company_name || '',
        description: editingSupplier.description || '',
        contact_person: editingSupplier.contact_person || '',
        email: editingSupplier.email || '',
        phone: editingSupplier.phone || '',
        phone2: editingSupplier.phone2 || '',
        whatsapp: editingSupplier.whatsapp || '',
        instagram: editingSupplier.instagram || '',
        wechat_id: editingSupplier.wechat_id || '',
        address: editingSupplier.address || '',
        city: editingSupplier.city || '',
        country: editingSupplier.country || '',
        website: editingSupplier.website || '',
        notes: editingSupplier.notes || '',
        payment_account_type: editingSupplier.payment_account_type || '',
        mobile_money_account: editingSupplier.mobile_money_account || '',
        bank_account_number: editingSupplier.bank_account_number || '',
        bank_name: editingSupplier.bank_name || '',
        is_active: editingSupplier.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        company_name: '',
        description: '',
        contact_person: '',
        email: '',
        phone: '',
        phone2: '',
        whatsapp: '',
        instagram: '',
        wechat_id: '',
        address: '',
        city: '',
        country: '',
        website: '',
        notes: '',
        payment_account_type: '',
        mobile_money_account: '',
        bank_account_number: '',
        bank_name: '',
        is_active: true
      });
    }
  }, [editingSupplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Phone
              </label>
              <input
                type="tel"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WeChat ID
              </label>
              <input
                type="text"
                value={formData.wechat_id}
                onChange={(e) => setFormData({ ...formData, wechat_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Country</option>
                {countryOptions.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.icon} {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Account Type
              </label>
              <select
                value={formData.payment_account_type}
                onChange={(e) => setFormData({ ...formData, payment_account_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Payment Type</option>
                {paymentTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Details */}
          {formData.payment_account_type === 'mobile_money' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Money Account
              </label>
              <input
                type="tel"
                value={formData.mobile_money_account}
                onChange={(e) => setFormData({ ...formData, mobile_money_account: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., +255 123 456 789"
              />
            </div>
          )}

          {formData.payment_account_type === 'bank_account' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active Supplier
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <GlassButton
              type="button"
              onClick={onClose}
              className="px-6 py-2"
              disabled={isLoading}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {editingSupplier ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                editingSupplier ? 'Update Supplier' : 'Create Supplier'
              )}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

const SupplierManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { suppliers, loading, refreshSuppliers } = useSuppliers();
  const navigate = useNavigate();
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = [
    { value: 'all', label: 'All Countries', icon: <MapPin size={16} /> },
    { value: 'TZ', label: 'Tanzania', icon: <MapPin size={16} /> },
    { value: 'CN', label: 'China', icon: <MapPin size={16} /> },
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
    console.log('SupplierManagementPage: Environment info', {
      isDev: import.meta.env.DEV,
      hostname: window.location.hostname,
      url: window.location.href
    });
    
    // Refresh suppliers when component loads
    refreshSuppliers();
  }, [refreshSuppliers]);

  const filterSuppliers = useCallback(() => {
    let filtered = suppliers;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery)
      );
    }

    // Filter by country
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(supplier => supplier.country === selectedCountry);
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchQuery, selectedCountry]);

  useEffect(() => {
    filterSuppliers();
  }, [filterSuppliers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
  };

  const handleSubmitSupplier = async (supplierData: any) => {
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierData);
        toast.success('Supplier updated successfully!');
      } else {
        await createSupplier(supplierData);
        toast.success('Supplier created successfully!');
      }
      await refreshSuppliers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save supplier');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await hardDeleteSupplier(supplier.id);
      toast.success('Supplier deleted successfully!');
      await refreshSuppliers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete supplier');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
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
        {loading ? (
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
                    <div className={`w-3 h-3 rounded-full shadow-lg border-2 border-white ${supplier.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
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
                    {supplier.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail size={14} className="text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{supplier.email}</span>
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
                        onClick={() => handleDeleteSupplier(supplier)}
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
        <SupplierForm
          isOpen={showSupplierForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmitSupplier}
          editingSupplier={editingSupplier}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default SupplierManagementPage;
