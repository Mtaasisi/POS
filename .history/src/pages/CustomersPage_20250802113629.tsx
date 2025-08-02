import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../context/CustomersContext';
import { Customer, LoyaltyLevel } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SearchBar from '../components/ui/SearchBar';
import CustomerFilters from '../components/CustomerFilters';
import { 
  Star, UserCheck, Tag, Download, MessageSquare, Trash2, Plus, Grid, List, Filter, SortAsc,
  AlertCircle, UserPlus, FileSpreadsheet, Users, DollarSign, Activity, MessageCircle, BarChart3, Award,
  Clock, Phone, Mail, Edit, Eye, CheckCircle, XCircle, BarChart2, Crown, Calendar, RotateCcw, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BulkSMSModal from '../components/BulkSMSModal';
import ExcelImportModal from '../components/ExcelImportModal';
import CustomerUpdateImportModal from '../components/CustomerUpdateImportModal';
import DropdownPortal from '../components/ui/DropdownPortal';
import { SMSService } from '../services/smsService';
import { fetchAllCustomers } from '../lib/customerApi';
import { formatCurrency } from '../lib/customerApi';
import AddCustomerModal from '../components/forms/AddCustomerModal';

// Helper to escape CSV fields
function escapeCSVField(field: any) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  if (str.includes(',') || str.includes('\n')) {
    return '"' + str + '"';
  }
  return str;
}

const LOCAL_STORAGE_KEY = 'customersPagePrefs';

const getInitialPrefs = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const CustomersPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { markCustomerAsRead } = useCustomers();
  // Restore preferences from localStorage
  const prefs = getInitialPrefs();
  const [searchQuery, setSearchQuery] = useState(prefs.searchQuery ?? '');
  const [loyaltyFilter, setLoyaltyFilter] = useState<LoyaltyLevel | 'all'>(prefs.loyaltyFilter ?? 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(prefs.statusFilter ?? 'all');
  const [showInactive, setShowInactive] = useState(prefs.showInactive ?? false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(prefs.showAdvancedFilters ?? false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(prefs.viewMode ?? 'grid');
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showCustomerUpdateImport, setShowCustomerUpdateImport] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [sortBy, setSortBy] = useState(prefs.sortBy ?? 'name');

  // Add state for multi-select filters
  const [loyaltyFilterMulti, setLoyaltyFilterMulti] = useState<LoyaltyLevel[]>([]);
  const [statusFilterMulti, setStatusFilterMulti] = useState<Array<'active' | 'inactive'>>([]);
  const [tagFilterMulti, setTagFilterMulti] = useState<string[]>([]);
  const [referralFilterMulti, setReferralFilterMulti] = useState<string[]>([]);
  const [birthdayFilter, setBirthdayFilter] = useState(false);
  const [whatsappFilter, setWhatsappFilter] = useState(false);

  // Persist preferences to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        searchQuery,
        loyaltyFilter,
        statusFilter,
        showInactive,
        showAdvancedFilters,
        viewMode,
        sortBy,
      })
    );
  }, [searchQuery, loyaltyFilter, statusFilter, showInactive, showAdvancedFilters, viewMode, sortBy]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await fetchAllCustomers();
        setCustomers(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate statistics from comprehensive data
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const vipCustomers = customers.filter(c => c.colorTag === 'vip').length;
    
    // Calculate total revenue from all customer payments
    const totalRevenue = customers.reduce((sum, customer) => {
      const customerPayments = customer.payments?.filter(p => p.status === 'completed') || [];
      return sum + customerPayments.reduce((customerSum, p) => customerSum + (p.amount || 0), 0);
    }, 0);
    
    const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
    const platinumCustomers = customers.filter(c => c.loyaltyLevel === 'platinum').length;
    const goldCustomers = customers.filter(c => c.loyaltyLevel === 'gold').length;
    const silverCustomers = customers.filter(c => c.loyaltyLevel === 'silver').length;
    const bronzeCustomers = customers.filter(c => c.loyaltyLevel === 'bronze').length;

    // Calculate device statistics
    const totalDevices = customers.reduce((sum, customer) => sum + (customer.devices?.length || 0), 0);
    const devicesInRepair = customers.reduce((sum, customer) => {
      const repairDevices = customer.devices?.filter(d => d.status === 'in-repair' || d.status === 'diagnosis-started') || [];
      return sum + repairDevices.length;
    }, 0);

    return {
      totalCustomers,
      activeCustomers,
      vipCustomers,
      totalRevenue,
      totalPoints,
      platinumCustomers,
      goldCustomers,
      silverCustomers,
      bronzeCustomers,
      totalDevices,
      devicesInRepair
    };
  }, [customers]);

  // Clean filter implementation
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(customer => {
        const searchableFields = [
          customer.name,
          customer.phone,
          customer.city,
          customer.email
        ].filter(Boolean);
        
        return searchableFields.some(field => 
          field.toLowerCase().includes(query)
        );
      });
    }

    // Loyalty filter
    if (loyaltyFilterMulti.length > 0) {
      filtered = filtered.filter(customer => 
        customer.loyaltyLevel && loyaltyFilterMulti.includes(customer.loyaltyLevel)
      );
    }

    // Status filter
    if (statusFilterMulti.length > 0) {
      filtered = filtered.filter(customer => {
        const status = customer.isActive ? 'active' : 'inactive';
        return statusFilterMulti.includes(status);
      });
    }

    // Tag filter
    if (tagFilterMulti.length > 0) {
      filtered = filtered.filter(customer => 
        customer.colorTag && tagFilterMulti.includes(customer.colorTag)
      );
    }

    // Referral source filter
    if (referralFilterMulti.length > 0) {
      filtered = filtered.filter(customer => 
        customer.referralSource && referralFilterMulti.includes(customer.referralSource)
      );
    }

    // Birthday filter
    if (birthdayFilter) {
      filtered = filtered.filter(customer => 
        customer.birthMonth || customer.birthDay
      );
    }

    // WhatsApp filter
    if (whatsappFilter) {
      filtered = filtered.filter(customer => 
        customer.whatsapp && customer.whatsapp.trim() !== ''
      );
    }

    // Inactive filter
    if (showInactive) {
      filtered = filtered.filter(customer => {
        if (!customer.lastVisit) return false;
        const lastVisitDate = new Date(customer.lastVisit);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        return lastVisitDate < ninetyDaysAgo;
      });
    }

    // Sort customers
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'recent':
          return new Date(b.joinedDate || 0).getTime() - new Date(a.joinedDate || 0).getTime();
        case 'spent':
          const spentA = a.totalSpent ?? (a.payments ? a.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0);
          const spentB = b.totalSpent ?? (b.payments ? b.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0);
          return spentB - spentA;
        case 'points':
          return (b.points || 0) - (a.points || 0);
        default:
          return 0;
      }
    });
  }, [customers, searchQuery, loyaltyFilterMulti, statusFilterMulti, tagFilterMulti, referralFilterMulti, birthdayFilter, whatsappFilter, showInactive, sortBy]);

  const getColorTagStyle = (tag: Customer['colorTag']) => {
    switch (tag) {
      case 'vip':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-300/30';
      case 'complainer':
        return 'bg-rose-500/20 text-rose-700 border-rose-300/30';
      case 'purchased':
        return 'bg-blue-500/20 text-blue-700 border-blue-300/30';
      case 'new':
        return 'bg-purple-500/20 text-purple-700 border-purple-300/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-300/30';
    }
  };

  const getLoyaltyStyle = (level: LoyaltyLevel) => {
    switch (level) {
      case 'platinum':
        return 'bg-purple-500/20 text-purple-700 border-purple-300/30';
      case 'gold':
        return 'bg-amber-500/20 text-amber-700 border-amber-300/30';
      case 'silver':
        return 'bg-gray-400/20 text-gray-700 border-gray-300/30';
      default:
        return 'bg-orange-500/20 text-orange-700 border-orange-300/30';
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers first');
      return;
    }
    
    switch (action) {
      case 'export':
        // Export selected customers
        toast.success(`Exported ${selectedCustomers.length} customers`);
        break;
      case 'message':      // Send bulk message
        toast.success(`Message sent to ${selectedCustomers.length} customers`);
        break;
      case 'delete':
        // Delete selected customers
        toast.success(`Deleted ${selectedCustomers.length} customers`);
        break;
    }
    setSelectedCustomers([]);
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  // Add this handler for sending SMS
  const handleBulkSMSSend = async (recipients: Customer[], message: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to send SMS');
      return;
    }

    setSendingSMS(true);
    try {
      const smsService = new SMSService();
      const result = await smsService.sendBulkSMSToCustomers(
        recipients.map(c => ({ id: c.id, phone: c.phone, name: c.name })),
        message,
        currentUser.id
      );

      if (result.success) {
        toast.success(`SMS sent successfully to all ${result.totalSent} customers!`);
      } else if (result.totalSent > 0) {
        toast.success(`SMS sent to ${result.totalSent} customers, ${result.totalFailed} failed.`);
      } else {
        toast.error(`Failed to send SMS to any customers. ${result.totalFailed} errors.`);
      }

      // Log detailed results
              // Bulk SMS completed
      
    } catch (error) {
      console.error('BulkSMS Error:', error);
      toast.error('Failed to send bulk SMS. Please try again.');
    } finally {
      setSendingSMS(false);
      setShowBulkSMS(false);
    }
  };

  const handleExcelImportComplete = (importedCustomers: Customer[]) => {
    setCustomers(prev => [...prev, ...importedCustomers]);
    setShowExcelImport(false);
    toast.success(`Successfully imported ${importedCustomers.length} customers`);
  };

  const handleCustomerUpdateImportComplete = (updatedCustomers: Customer[]) => {
    setCustomers(prev => 
      prev.map(customer => {
        const updatedCustomer = updatedCustomers.find(uc => uc.id === customer.id);
        return updatedCustomer || customer;
      })
    );
    setShowCustomerUpdateImport(false);
    toast.success(`Successfully updated ${updatedCustomers.length} customers`);
  };

  // Helper: get total spent for a customer from their payments
  const getCustomerTotalSpent = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.payments) return 0;
    return customer.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Helper: get customer devices count and last activity
  const getCustomerDeviceInfo = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.devices) return { count: 0, lastActivity: 'No devices' };
    
    const deviceCount = customer.devices.length;
    let lastActivity = '';
    
    if (deviceCount > 0) {
      const lastDevice = customer.devices.reduce((latest, device) => {
        const deviceDate = new Date(device.updatedAt || device.createdAt);
        const latestDate = new Date(latest.updatedAt || latest.createdAt);
        return deviceDate > latestDate ? device : latest;
      }, customer.devices[0]);
      
      const lastDate = new Date(lastDevice.updatedAt || lastDevice.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) lastActivity = 'Today';
      else if (diffDays === 1) lastActivity = '1 day ago';
      else lastActivity = `${diffDays} days ago`;
    } else {
      lastActivity = 'No devices';
    }
    
    return { count: deviceCount, lastActivity };
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading customers: {error}</p>
            <GlassButton onClick={() => window.location.reload()}>
              Try Again
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {isOffline && (
        <div style={{ background: '#fbbf24', color: 'black', padding: '8px', textAlign: 'center' }}>
          You are offline. Data is loaded from cache.
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships and track loyalty</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => setShowAddCustomerModal(true)}
            icon={<UserPlus size={18} />}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            New Customer
          </GlassButton>
          {['admin', 'customer-care'].includes(currentUser?.role || '') && (
            <>
              <GlassButton
                onClick={() => navigate('/customers/import')}
                icon={<FileSpreadsheet size={18} />}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                Import Excel
              </GlassButton>
              <GlassButton
                onClick={() => setShowExcelImport(true)}
                icon={<FileSpreadsheet size={18} />}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                Import New
              </GlassButton>
              <GlassButton
                onClick={() => {
                  console.log('Update Existing button clicked');
                  setShowCustomerUpdateImport(true);
                  console.log('showCustomerUpdateImport set to true');
                }}
                icon={<RefreshCw size={18} />}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
              >
                Update Existing
              </GlassButton>
              <GlassButton
                onClick={() => navigate('/customers/update-data')}
                icon={<RotateCcw size={18} />}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
              >
                Update Data
              </GlassButton>
            </>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Customers</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeCustomers}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Total Devices</p>
              <p className="text-2xl font-bold text-amber-900">{stats.totalDevices}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <Activity className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900">Loyalty Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium">Platinum</span>
              </div>
              <span className="text-sm text-gray-600">{stats.platinumCustomers} customers</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium">Gold</span>
              </div>
              <span className="text-sm text-gray-600">{stats.goldCustomers} customers</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium">Silver</span>
              </div>
              <span className="text-sm text-gray-600">{stats.silverCustomers} customers</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">Bronze</span>
              </div>
              <span className="text-sm text-gray-600">{stats.bronzeCustomers} customers</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <GlassButton
              variant="secondary"
              icon={<MessageCircle size={16} />}
              onClick={() => setShowBulkSMS(true)}
              className="text-sm"
            >
              Send SMS
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<BarChart3 size={16} />}
              onClick={() => navigate('/customer-analytics')}
              className="text-sm"
            >
              Analytics
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Award size={16} />}
              onClick={() => navigate('/points-management')}
              className="text-sm"
            >
              Points
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Calendar size={16} />}
              onClick={() => navigate('/customer-events')}
              className="text-sm"
            >
              Events
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* New Filter Component */}
      <CustomerFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        loyaltyFilter={loyaltyFilterMulti}
        onLoyaltyFilterChange={setLoyaltyFilterMulti}
        statusFilter={statusFilterMulti}
        onStatusFilterChange={setStatusFilterMulti}
        tagFilter={tagFilterMulti}
        onTagFilterChange={setTagFilterMulti}
        referralFilter={referralFilterMulti}
        onReferralFilterChange={setReferralFilterMulti}
        birthdayFilter={birthdayFilter}
        onBirthdayFilterChange={setBirthdayFilter}
        whatsappFilter={whatsappFilter}
        onWhatsappFilterChange={setWhatsappFilter}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        customers={customers}
      />

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <GlassCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                icon={<MessageCircle size={16} />}
                onClick={() => handleBulkAction('message')}
                className="text-sm"
              >
                Send Message
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Download size={16} />}
                onClick={() => handleBulkAction('export')}
                className="text-sm"
              >
                Export
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<XCircle size={16} />}
                onClick={() => setSelectedCustomers([])}
                className="text-sm text-red-600"
              >
                Clear
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Customers Display */}
      {viewMode === 'list' ? (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50">
                  <th className="text-left py-4 px-4 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Contact</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Devices</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-700">Total Spent</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-700">Loyalty</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-700">Points</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const deviceInfo = getCustomerDeviceInfo(customer.id);
                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-200/30 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => {
                        navigate(`/customers/${customer.id}`);
                        markCustomerAsRead(customer.id);
                      }}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={e => { e.stopPropagation(); toggleCustomerSelection(customer.id); }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-900">{customer.phone}</span>
                          </div>
                          {customer.whatsapp && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <MessageSquare className="w-3 h-3" />
                              <span>{customer.whatsapp}</span>
                            </div>
                          )}
                          {customer.referralSource && (
                            <div className="flex items-center gap-1 text-xs text-purple-600">
                              <Tag className="w-3 h-3" />
                              <span>{customer.referralSource}</span>
                            </div>
                          )}
                          {(customer.birthMonth || customer.birthDay) && (
                            <div className="flex items-center gap-1 text-xs text-pink-600">
                              <Calendar className="w-3 h-3" />
                              <span>{customer.birthMonth} {customer.birthDay}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="text-gray-900 font-semibold">{deviceInfo.count} device{deviceInfo.count !== 1 ? 's' : ''}</p>
                          <p className="text-sm text-gray-600">Last: {deviceInfo.lastActivity}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-gray-900 font-semibold">{formatCurrency(getCustomerTotalSpent(customer.id))}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border
                          ${getLoyaltyStyle(customer.loyaltyLevel)}
                        `}>
                          <Star size={14} />
                          <span className="capitalize">{customer.loyaltyLevel}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-gray-900 font-semibold">{customer.points}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border
                          ${getColorTagStyle(customer.colorTag)}
                        `}>
                          {!customer.isActive && <Clock size={14} />}
                          <span className="capitalize">{customer.colorTag}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={e => { 
                              e.stopPropagation(); 
                              navigate(`/customers/${customer.id}`);
                              markCustomerAsRead(customer.id);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/customers/${customer.id}`, { state: { openEdit: true } }); }}
                            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                            title="Edit Customer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/sms-control?customer=${customer.id}`); }}
                            className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                            title="Send Message"
                          >
                            <MessageCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.map(customer => {
            const deviceInfo = getCustomerDeviceInfo(customer.id);
            return (
              <GlassCard
                key={customer.id}
                onClick={() => {
                  navigate(`/customers/${customer.id}`);
                  markCustomerAsRead(customer.id);
                }}
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div className={`
                    px-2 py-1 rounded-full text-xs border
                    ${getColorTagStyle(customer.colorTag)}
                  `}>
                    {customer.colorTag}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{customer.city}</p>
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{customer.phone}</span>
                </div>
                
                {/* WhatsApp and Referral Source */}
                {customer.whatsapp && (
                  <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp: {customer.whatsapp}</span>
                  </div>
                )}
                
                {customer.referralSource && (
                  <div className="flex items-center gap-2 text-xs text-purple-600 mb-1">
                    <Tag className="w-3 h-3" />
                    <span>From: {customer.referralSource}</span>
                  </div>
                )}
                
                {/* Birthday Information */}
                {(customer.birthMonth || customer.birthDay) && (
                  <div className="flex items-center gap-2 text-xs text-pink-600 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {customer.birthMonth} {customer.birthDay}
                    </span>
                  </div>
                )}
                
                {/* Email hidden for privacy */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{deviceInfo.count} device{deviceInfo.count !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>Last: {deviceInfo.lastActivity}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border
                    ${getLoyaltyStyle(customer.loyaltyLevel)}
                  `}>
                    <Star size={12} />
                    <span className="capitalize">{customer.loyaltyLevel}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{customer.points} pts</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(getCustomerTotalSpent(customer.id))}</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={e => { 
                      e.stopPropagation(); 
                      navigate(`/customers/${customer.id}`);
                      markCustomerAsRead(customer.id);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/customers/${customer.id}`); }}
                    className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                    title="View Customer"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/sms-control?customer=${customer.id}`); }}
                    className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                    title="Send Message"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <GlassCard className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
          <GlassButton
            onClick={() => setShowAddCustomerModal(true)}
            icon={<UserPlus size={18} />}
          >
            Add Your First Customer
          </GlassButton>
        </GlassCard>
      )}

      {/* Bulk SMS Modal */}
      <BulkSMSModal
        open={showBulkSMS}
        onClose={() => setShowBulkSMS(false)}
        customers={customers}
        onSend={handleBulkSMSSend}
        sending={sendingSMS}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImportComplete={handleExcelImportComplete}
      />

      {/* Customer Update Import Modal */}
      <CustomerUpdateImportModal
        isOpen={showCustomerUpdateImport}
        onClose={() => setShowCustomerUpdateImport(false)}
        onImportComplete={handleCustomerUpdateImportComplete}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerCreated={(customer) => {
          setShowAddCustomerModal(false);
          navigate(`/customers/${customer.id}`);
        }}
      />
    </div>
  );
};

export default CustomersPage;