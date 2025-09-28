import React, { useState, useEffect } from 'react';
import { 
  X, Users, Phone, Mail, MapPin, Calendar, Star, MessageSquare, 
  Smartphone, CreditCard, Gift, Tag, Bell, BarChart2, PieChart, 
  ShoppingBag, Wrench, TrendingUp, DollarSign, Package, Clock, 
  AlertTriangle, CheckCircle, XCircle, Info, Edit, QrCode, 
  Copy, Download, Share2, History, Building, Target, Percent, 
  Calculator, Banknote, Receipt, Layers, FileText, UserCheck,
  CalendarDays, MessageCircle, RotateCcw, UserPlus, Settings,
  Shield, Award, Globe, Heart, Eye, EyeOff, Send, Archive
} from 'lucide-react';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import { Customer, Device, Payment } from '../../../types';
import { formatCurrency } from '../../../lib/customerApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useDevices } from '../../../context/DevicesContext';
import { usePayments } from '../../../context/PaymentsContext';
import { calculatePointsForDevice } from '../../../lib/pointsConfig';
import { smsService } from '../../../services/smsService';
import { checkInCustomer } from '../../../lib/customerApi';
import { supabase } from '../../../lib/supabaseClient';
import Modal from '../../shared/components/ui/Modal';
import CustomerForm from './forms/CustomerForm';
import PointsManagementModal from '../../finance/components/PointsManagementModal';
import BarcodeScanner from '../../devices/components/BarcodeScanner';
import { fetchCustomerAppointments, createAppointment } from '../../../lib/customerApi/appointments';
import { fetchCustomerReturns } from '../../../lib/customerApi/returns';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import AppointmentModal from './forms/AppointmentModal';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEdit?: (customer: Customer) => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit
}) => {
  const { currentUser } = useAuth();
  const { addNote, updateCustomer, markCustomerAsRead } = useCustomers();
  const [currentCustomer, setCurrentCustomer] = useState(customer);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Enhanced customer data state
  const [devices, setDevices] = useState<Device[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [posSales, setPosSales] = useState<any[]>([]);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [sparePartUsage, setSparePartUsage] = useState<any[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [loadingEnhancedData, setLoadingEnhancedData] = useState(false);
  
  // Additional data state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [customerPreferences, setCustomerPreferences] = useState<any>(null);
  const [loadingAdditionalData, setLoadingAdditionalData] = useState(false);

  // Modal states
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Update current customer when prop changes
  useEffect(() => {
    setCurrentCustomer(customer);
  }, [customer]);

  // Load enhanced customer data
  useEffect(() => {
    if (isOpen && customer?.id) {
      loadEnhancedCustomerData();
      loadAdditionalCustomerData();
    }
  }, [isOpen, customer?.id]);

  // Enhanced data fetching functions
  const loadEnhancedCustomerData = async () => {
    if (!customer?.id) return;
    
    setLoadingEnhancedData(true);
    try {
      // Set basic data
      setDevices(customer.devices || []);
      setPayments(customer.payments || []);

      // Fetch POS sales with detailed items for this specific customer
      const { data: posData, error: posError } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items(
            *,
            lats_products(name, description),
            lats_product_variants(name, sku, attributes)
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (!posError && posData) {
        setPosSales(posData);
        
        // Extract sale items
        const allItems = posData.flatMap((sale: any) => 
          (sale.lats_sale_items || []).map((item: any) => ({
            ...item,
            saleNumber: sale.sale_number,
            saleDate: sale.created_at,
            paymentMethod: sale.payment_method,
            saleStatus: sale.status
          }))
        );
        setSaleItems(allItems);
      }

      // Fetch spare part usage for this customer
      const { data: spareData, error: spareError } = await supabase
        .from('lats_spare_part_usage')
        .select(`
          *,
          lats_spare_parts(name, part_number, cost_price, selling_price)
        `)
        .eq('customer_id', customer.id)
        .order('used_at', { ascending: false });

      if (!spareError && spareData) {
        setSparePartUsage(spareData);
      }

      // Calculate customer analytics
      const analytics = calculateCustomerAnalytics(customer.id, posData || [], spareData || []);
      setCustomerAnalytics(analytics);

    } catch (error) {
      console.error('Error fetching enhanced customer data:', error);
    } finally {
      setLoadingEnhancedData(false);
    }
  };

  // Load additional customer data
  const loadAdditionalCustomerData = async () => {
    if (!customer?.id) return;
    
    setLoadingAdditionalData(true);
    try {
      // Fetch appointments
      try {
        const appointmentsData = await fetchCustomerAppointments(customer.id);
        setAppointments(appointmentsData || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointments([]);
      }

      // Fetch returns/warranty information
      try {
        const returnsData = await fetchCustomerReturns(customer.id);
        setReturns(returnsData || []);
      } catch (error) {
        console.error('Error fetching returns:', error);
        setReturns([]);
      }

      // Fetch communication history (SMS logs)
      try {
        const { data: smsData, error: smsError } = await supabase
          .from('sms_logs')
          .select('*')
          .eq('phone_number', customer.phone?.replace(/\D/g, '') || '')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!smsError && smsData) {
          setCommunicationHistory(smsData);
        }
      } catch (error) {
        console.error('Error fetching communication history:', error);
        setCommunicationHistory([]);
      }

      // Fetch referrals (customers referred by this customer)
      try {
        const { data: referralsData, error: referralsError } = await supabase
          .from('customers')
          .select('id, name, phone, created_at, total_spent')
          .eq('referred_by', customer.id)
          .order('created_at', { ascending: false });

        if (!referralsError && referralsData) {
          setReferrals(referralsData);
        }
      } catch (error) {
        console.error('Error fetching referrals:', error);
        setReferrals([]);
      }

      // Fetch customer preferences
      try {
        const { data: prefsData, error: prefsError } = await supabase
          .from('customer_preferences')
          .select('*')
          .eq('customer_id', customer.id);

        if (!prefsError && prefsData && prefsData.length > 0) {
          setCustomerPreferences(prefsData[0]);
        } else {
          setCustomerPreferences(null);
        }
      } catch (error) {
        console.error('Error fetching customer preferences:', error);
        setCustomerPreferences(null);
      }

    } catch (error) {
      console.error('Error loading additional customer data:', error);
    } finally {
      setLoadingAdditionalData(false);
    }
  };

  const calculateCustomerAnalytics = (customerId: string, posSales: any[], spareUsage: any[]) => {
    const totalPosSpent = posSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalSpareSpent = spareUsage.reduce((sum, usage) => sum + (usage.lats_spare_parts?.selling_price || 0), 0);
    
    // Calculate device-related revenue for this customer from customer_payments table
    const customerDevices = devices.filter(device => device.customerId === customerId);
    const customerDeviceIds = customerDevices.map(device => device.id);
    
    // Get payments for this customer's devices
    const customerDevicePayments = payments.filter(payment => 
      payment.deviceId && customerDeviceIds.includes(payment.deviceId)
    );
    
    const totalDevicePayments = customerDevicePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate breakdown by payment type
    const totalDeposits = customerDevicePayments.filter(payment => payment.type === 'deposit')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalRepairPayments = customerDevicePayments.filter(payment => payment.type === 'payment')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalRefunds = customerDevicePayments.filter(payment => payment.type === 'refund')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    const totalDeviceSpent = totalDevicePayments;
    const totalSpent = totalPosSpent + totalSpareSpent + totalDeviceSpent;
    
    // Calculate unique products and total items from saleItems state
    const allItems = posSales.flatMap((sale: any) => 
      (sale.lats_sale_items || []).map((item: any) => ({
        ...item,
        saleNumber: sale.sale_number,
        saleDate: sale.created_at,
        paymentMethod: sale.payment_method,
        saleStatus: sale.status
      }))
    );
    
    const uniqueProducts = new Set(allItems.map(item => item.product_id)).size;
    const totalItems = allItems.length;
    
    const averageOrderValue = posSales.length > 0 ? totalPosSpent / posSales.length : 0;
    
    const lastPurchaseDate = posSales.length > 0 ? new Date(posSales[0].created_at) : null;
    const daysSinceLastPurchase = lastPurchaseDate ? Math.floor((Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    // Calculate customer ranking based on spending
    const customerRanking = totalSpent > 100000 ? 'Top Customer' : totalSpent > 50000 ? 'VIP Customer' : 'Regular Customer';
    
    return {
      totalSpent,
      totalPosSpent,
      totalSpareSpent,
      totalDeviceSpent,
      deviceBreakdown: {
        payments: totalRepairPayments,
        deposits: totalDeposits,
        refunds: totalRefunds,
        totalPayments: totalDevicePayments
      },
      uniqueProducts,
      totalItems,
      averageOrderValue,
      lastPurchaseDate,
      daysSinceLastPurchase,
      purchaseFrequency: posSales.length > 0 ? posSales.length / Math.max(1, Math.floor((Date.now() - new Date(customer?.joinedDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0,
      customerRanking
    };
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-500">{customer.phone}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </div>
            </button>
                        <button
                          onClick={() => setActiveTab('activity')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'activity'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Activity
                          </div>
                        </button>
                        <button
                          onClick={() => setActiveTab('business')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'business'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Business
                          </div>
                        </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Spent</div>
                  <div className="text-lg font-bold text-emerald-900">
                    {loadingEnhancedData ? '...' : formatCurrency(customerAnalytics?.totalSpent || 0)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Orders</div>
                  <div className="text-lg font-bold text-blue-900">
                    {loadingEnhancedData ? '...' : posSales.length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Devices</div>
                  <div className="text-lg font-bold text-orange-900">
                    {loadingEnhancedData ? '...' : devices.length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Points</div>
                  <div className="text-lg font-bold text-purple-900">
                    {loadingEnhancedData ? '...' : customer.points || 0}
                  </div>
                </div>
              </div>
              
              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Customer Info */}
                <div className="space-y-6">
                  {/* Customer Avatar & Basic Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-white/30">
                      {customer.profileImage ? (
                        <img 
                          src={customer.profileImage} 
                          alt={customer.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.colorTag === 'vip' ? 'bg-emerald-500/20 text-emerald-700' : 
                          customer.colorTag === 'complainer' ? 'bg-rose-500/20 text-rose-700' : 
                          customer.colorTag === 'purchased' ? 'bg-blue-500/20 text-blue-700' : 
                          customer.colorTag === 'new' ? 'bg-purple-500/20 text-purple-700' : 
                          'bg-gray-500/20 text-gray-700'
                        }`}>
                          <Tag size={10} />
                          {customer.colorTag}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-700">
                          <Star size={10} />
                          {customer.loyaltyLevel}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-700">
                          <Gift size={10} />
                          {customer.points || 0} pts
                        </span>
                        {customer.gender && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-700">
                            <UserCheck size={10} />
                            {customer.gender}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Contact Information</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">{customer.phone || 'Not provided'}</span>
                      </div>
                      {customer.whatsapp && (
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">WhatsApp:</span>
                          <span className="text-sm font-medium text-gray-900">{customer.whatsapp}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium text-gray-900">{customer.email}</span>
                        </div>
                      )}
                      {customer.city && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Location:</span>
                          <span className="text-sm font-medium text-gray-900">{customer.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(customer.birthMonth && customer.birthDay) && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Birthday</span>
                          <p className="text-sm font-medium text-gray-900">
                            {customer.birthMonth}/{customer.birthDay}
                          </p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Account Status</span>
                        <p className="text-sm font-medium text-gray-900">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Member Since</span>
                        <p className="text-sm font-medium text-gray-900">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 
                           customer.joinedDate ? new Date(customer.joinedDate).toLocaleDateString() : 
                           'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Last Visit</span>
                        <p className="text-sm font-medium text-gray-900">
                          {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 
                           customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 
                           'Never'}
                        </p>
                      </div>
                      {customer.gender && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Gender</span>
                          <p className="text-sm font-medium text-gray-900 capitalize">{customer.gender}</p>
                        </div>
                      )}
                      {customer.country && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Country</span>
                          <p className="text-sm font-medium text-gray-900">{customer.country}</p>
                        </div>
                      )}
                      {customer.address && (
                        <div className="space-y-1 col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Address</span>
                          <p className="text-sm font-medium text-gray-900">{customer.address}</p>
                        </div>
                      )}
                      {customer.notes && (
                        <div className="space-y-1 col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Notes</span>
                          <p className="text-sm font-medium text-gray-900">{customer.notes}</p>
                        </div>
                      )}
                      {customer.initialNotes && (
                        <div className="space-y-1 col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Initial Notes</span>
                          <p className="text-sm font-medium text-gray-900">{customer.initialNotes}</p>
                        </div>
                      )}
                      {customer.birthday && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Birthday Date</span>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(customer.birthday).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {customer.profileImage && (
                        <div className="space-y-1 col-span-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Profile Image</span>
                          <div className="mt-2">
                            <img 
                              src={customer.profileImage} 
                              alt="Profile" 
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  {(customer.referralSource || customer.referredBy || referrals.length > 0 || customer.totalReturns > 0 || customer.createdBy || customer.referrals) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Building className="w-5 h-5 text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Business Information</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {customer.referralSource && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Referral Source</span>
                            <p className="text-sm font-medium text-gray-900">{customer.referralSource}</p>
                          </div>
                        )}
                        {customer.referredBy && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Referred By</span>
                            <p className="text-sm font-medium text-gray-900">{customer.referredBy}</p>
                          </div>
                        )}
                        {referrals.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Customers Referred</span>
                            <p className="text-sm font-medium text-gray-900">{referrals.length} customers</p>
                          </div>
                        )}
                        {customer.totalReturns > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Returns</span>
                            <p className="text-sm font-medium text-gray-900">{customer.totalReturns}</p>
                          </div>
                        )}
                        {customer.createdBy && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Created By</span>
                            <p className="text-sm font-medium text-gray-900">User ID: {customer.createdBy}</p>
                          </div>
                        )}
                        {customer.referrals && customer.referrals.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Referral List</span>
                            <p className="text-sm font-medium text-gray-900">
                              {Array.isArray(customer.referrals) ? customer.referrals.length : 0} referrals
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Preferences & Settings */}
                  {(customerPreferences || customer.customerTag || customer.whatsappOptOut !== undefined) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Preferences & Settings</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {customer.customerTag && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Customer Tag</span>
                            <p className="text-sm font-medium text-gray-900">{customer.customerTag}</p>
                          </div>
                        )}
                        {customer.whatsappOptOut !== undefined && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">WhatsApp Opt-out</span>
                            <p className="text-sm font-medium text-gray-900">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                customer.whatsappOptOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {customer.whatsappOptOut ? 'Opted Out' : 'Active'}
                              </span>
                            </p>
                          </div>
                        )}
                        {customerPreferences && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Communication Preferences</span>
                            <p className="text-sm font-medium text-gray-900">
                              {customerPreferences.preferred_contact_method || 'Not specified'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Purchase History Summary */}
                  {(customer.totalSpent > 0 || customer.totalPurchases > 0 || customer.lastPurchaseDate) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Purchase History</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {customer.totalSpent > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Spent</span>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                          </div>
                        )}
                        {customer.totalPurchases > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Purchases</span>
                            <p className="text-sm font-medium text-gray-900">{customer.totalPurchases}</p>
                          </div>
                        )}
                        {customer.lastPurchaseDate && (
                          <div className="space-y-1 col-span-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Last Purchase</span>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Quick Stats */}
                <div className="space-y-6">
                  {/* Customer Status */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Customer Status</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Loyalty Level</span>
                        <p className="text-sm font-medium text-gray-900">{customer.loyaltyLevel}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Devices</span>
                        <p className="text-sm font-medium text-gray-900">{devices.length}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Active Repairs</span>
                        <p className="text-sm font-medium text-orange-600">
                          {devices.filter(d => ['assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing'].includes(d.status)).length}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Completed</span>
                        <p className="text-sm font-medium text-green-600">
                          {devices.filter(d => d.status === 'done').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Activity Tab - Devices, Payments, Appointments, Communications */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Devices Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Repair History</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Total: {devices.length}</span>
                    <span>•</span>
                    <span>Active: {devices.filter(d => ['assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing'].includes(d.status)).length}</span>
                    <span>•</span>
                    <span>Completed: {devices.filter(d => d.status === 'done').length}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-700">Device</th>
                        <th className="text-left p-3 font-medium text-gray-700">Status</th>
                        <th className="text-left p-3 font-medium text-gray-700">Issue</th>
                        <th className="text-left p-3 font-medium text-gray-700">Created</th>
                        <th className="text-left p-3 font-medium text-gray-700">Total Paid</th>
                        <th className="text-left p-3 font-medium text-gray-700">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map(device => {
                        const totalPaid = payments.filter(p => p.deviceId === device.id && p.status === 'completed')
                          .reduce((sum, p) => sum + (p.amount || 0), 0);
                        return (
                          <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{device.brand} {device.model}</div>
                                <div className="text-xs text-gray-500">{device.serialNumber || 'No serial'}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                device.status === 'done' ? 'bg-green-100 text-green-800' :
                                device.status === 'failed' ? 'bg-red-100 text-red-800' :
                                ['assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing'].includes(device.status) ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {device.status.replace(/-/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="max-w-xs truncate" title={device.issueDescription}>
                                {device.issueDescription}
                              </div>
                            </td>
                            <td className="p-3">{new Date(device.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              {totalPaid > 0 ? formatCurrency(totalPaid) : '-'}
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {calculatePointsForDevice(device, customer.loyaltyLevel)} pts
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {devices.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-gray-500 py-4">No repair history found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    {payments.length} payments • {formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))} total
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-700">Date</th>
                        <th className="text-left p-3 font-medium text-gray-700">Type</th>
                        <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                        <th className="text-left p-3 font-medium text-gray-700">Method</th>
                        <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0, 10).map(payment => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">{new Date(payment.date).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              payment.type === 'payment' ? 'bg-green-100 text-green-800' :
                              payment.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {payment.type}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{formatCurrency(payment.amount)}</td>
                          <td className="p-3">{payment.method}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-gray-500 py-4">No payments found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Appointments Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Appointments</h3>
                  </div>
                  <GlassButton
                    onClick={() => {/* TODO: Open appointment creation modal */}}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Schedule
                  </GlassButton>
                </div>

                {loadingAdditionalData ? (
                  <div className="text-center py-8 text-gray-500">Loading appointments...</div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map(appointment => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{appointment.service_type}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{appointment.duration_minutes} min</p>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        +{appointments.length - 5} more appointments
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No appointments found</p>
                    <p className="text-sm">Schedule the first appointment for this customer</p>
                  </div>
                )}
              </div>

              {/* Communications Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Recent Communications</h3>
                  </div>
                </div>

                {loadingAdditionalData ? (
                  <div className="text-center py-8 text-gray-500">Loading communication history...</div>
                ) : communicationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {communicationHistory.slice(0, 5).map((message, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">SMS</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {message.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{message.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {communicationHistory.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        +{communicationHistory.length - 5} more messages
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No communication history found</p>
                    <p className="text-sm">Start a conversation with this customer</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Tab - Returns, Referrals, Analytics, Preferences */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              {/* Returns & Warranty Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Returns & Warranty</h3>
                </div>

                {loadingAdditionalData ? (
                  <div className="text-center py-8 text-gray-500">Loading returns history...</div>
                ) : returns.length > 0 ? (
                  <div className="space-y-3">
                    {returns.slice(0, 5).map(returnItem => (
                      <div key={returnItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <RotateCcw className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {returnItem.manual_device_brand} {returnItem.manual_device_model}
                            </p>
                            <p className="text-sm text-gray-500">{returnItem.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            returnItem.status === 'return-resolved' ? 'bg-green-100 text-green-800' :
                            returnItem.status === 'return-accepted' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {returnItem.status.replace('return-', '')}
                          </span>
                          {returnItem.refund_amount && (
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {formatCurrency(returnItem.refund_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {returns.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        +{returns.length - 5} more returns
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <RotateCcw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No returns or warranty claims found</p>
                    <p className="text-sm">This customer has no return history</p>
                  </div>
                )}
              </div>

              {/* Referrals Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Referral Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* How they found us */}
                  {customer.referralSource && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">How they found us</h4>
                      <p className="text-blue-800">{customer.referralSource}</p>
                    </div>
                  )}

                  {/* Referred by */}
                  {customer.referredBy && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Referred by</h4>
                      <p className="text-green-800">{customer.referredBy}</p>
                    </div>
                  )}
                </div>

                {/* Customers they referred */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Customers they referred ({referrals.length})</h4>
                  
                  {loadingAdditionalData ? (
                    <div className="text-center py-4 text-gray-500">Loading referrals...</div>
                  ) : referrals.length > 0 ? (
                    <div className="space-y-3">
                      {referrals.slice(0, 5).map(referral => (
                        <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{referral.name}</p>
                              <p className="text-sm text-gray-500">{referral.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(referral.total_spent || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {referrals.length > 5 && (
                        <div className="text-center text-sm text-gray-500">
                          +{referrals.length - 5} more referrals
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No referrals yet</p>
                      <p className="text-sm">This customer hasn't referred anyone yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Communication Preferences Section */}
              {customerPreferences && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-6 h-6 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Communication Preferences</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {customerPreferences.sms_opt_in ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">SMS</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {customerPreferences.whatsapp_opt_in ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {customerPreferences.email_opt_in ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Email</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {customerPreferences.marketing_opt_in ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Marketing</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowSmsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
            
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              onClick={() => setShowPointsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Gift className="w-4 h-4" />
              Points
            </button>

            <button
              onClick={() => setShowCheckinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Check-in
            </button>

            <button
              onClick={() => setShowAppointmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <CalendarDays className="w-4 h-4" />
              Schedule
            </button>

            <button
              onClick={() => setShowPreferencesModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Settings className="w-4 h-4" />
              Preferences
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            
            {onEdit && (
              <button
                onClick={() => onEdit(customer)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SMS Modal */}
      <Modal isOpen={showSmsModal} onClose={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }} title="Send SMS" maxWidth="400px">
        <form
          onSubmit={async e => {
            e.preventDefault();
            setSmsSending(true);
            setSmsResult(null);
            const phoneNumber = customer.phone.replace(/\D/g, '');
            const result = await smsService.sendSMS(phoneNumber, smsMessage, customer.id);
            setSmsSending(false);
            setSmsResult(result.success ? 'SMS sent!' : `Failed: ${result.error}`);
            if (result.success) setSmsMessage('');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-gray-700 mb-1 font-medium">To</label>
            <div className="py-2 px-4 bg-gray-100 rounded">{customer.phone}</div>
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Message</label>
            <textarea
              value={smsMessage}
              onChange={e => setSmsMessage(e.target.value)}
              rows={3}
              className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Type your message here"
              required
            />
          </div>
          {smsResult && <div className={`text-sm ${smsResult.startsWith('Failed') ? 'text-red-600' : 'text-green-600'}`}>{smsResult}</div>}
          <div className="flex gap-3 justify-end mt-4">
            <GlassButton type="button" variant="secondary" onClick={() => { setShowSmsModal(false); setSmsMessage(''); setSmsResult(null); }}>Cancel</GlassButton>
            <GlassButton type="submit" variant="primary" disabled={smsSending}>{smsSending ? 'Sending...' : 'Send SMS'}</GlassButton>
          </div>
        </form>
      </Modal>

      {/* Points Management Modal */}
      <PointsManagementModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        customerId={customer.id}
        customerName={customer.name}
        currentPoints={customer.points || 0}
        loyaltyLevel={customer.loyaltyLevel}
        onPointsUpdated={(newPoints: number) => {
          updateCustomer(customer.id, { points: newPoints });
        }}
      />

      {/* Edit Customer Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer" maxWidth="xl">
        <CustomerForm
          onSubmit={async (values) => {
            setIsUpdating(true);
            try {
              const { notes, ...rest } = values;
              await updateCustomer(customer.id, rest);
              setShowEditModal(false);
            } finally {
              setIsUpdating(false);
            }
          }}
          onCancel={() => setShowEditModal(false)}
          isLoading={isUpdating}
          initialValues={{
            id: customer.id,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            gender: customer.gender === 'male' || customer.gender === 'female' ? customer.gender : 'male',
            city: customer.city || '',
            referralSource: customer.referralSource || '',
            birthMonth: customer.birthMonth || '',
            birthDay: customer.birthDay || '',
            notes: Array.isArray(customer.notes) && customer.notes.length > 0 ? customer.notes[customer.notes.length - 1].content : (typeof customer.notes === 'string' ? customer.notes : ''),
          }}
          renderActionsInModal={true}
        >
          {(actions, formFields) => (<>{formFields}{actions}</>)}
        </CustomerForm>
      </Modal>

      {/* Check-in Modal */}
      {showCheckinModal && (
        <Modal isOpen={showCheckinModal} onClose={() => { setShowCheckinModal(false); setCheckinSuccess(false); }} title="Customer Check-in">
          <div className="p-4">
            {checkinSuccess ? (
              <div className="text-green-600 font-bold text-center mb-4">Check-in successful! 20 points awarded.</div>
            ) : (
              <>
                <div className="mb-2 text-center text-gray-700">Scan the customer's QR code to check them in.</div>
                <BarcodeScanner
                  onClose={() => setShowCheckinModal(false)}
                  onScan={async (result: string) => {
                    setCheckinLoading(true);
                    try {
                      if (!currentUser?.id) throw new Error('No staff user.');
                      const resp = await checkInCustomer(result, currentUser.id);
                      if (resp.success) {
                        setCheckinSuccess(true);
                        toast.success('Check-in successful! Points awarded.');
                      } else {
                        toast.error(resp.message);
                      }
                    } catch (e: any) {
                      alert('Check-in failed: ' + (e.message || e));
                    } finally {
                      setCheckinLoading(false);
                    }
                  }}
                />
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDetailModal;
