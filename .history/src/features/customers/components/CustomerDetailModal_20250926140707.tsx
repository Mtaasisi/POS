import React, { useState, useEffect } from 'react';
import { 
  X, Users, Phone, Mail, MapPin, Calendar, Star, MessageSquare, 
  Smartphone, CreditCard, Gift, Tag, Bell, BarChart2, PieChart, 
  ShoppingBag, Wrench, TrendingUp, DollarSign, Package, Clock, 
  AlertTriangle, CheckCircle, XCircle, Info, Edit, QrCode, 
  Copy, Download, Share2, History, Target, Percent, 
  Calculator, Banknote, Receipt, Layers, FileText, UserCheck,
  CalendarDays, MessageCircle, Settings,
  Shield, Award, Globe, Heart, Eye, EyeOff, Send, Archive, Zap
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
import { getCustomerStatus, trackCustomerActivity, reactivateCustomer, checkInCustomerWithReactivation } from '../../../lib/customerStatusService';
import Modal from '../../shared/components/ui/Modal';
import CustomerForm from './forms/CustomerForm';
import PointsManagementModal from '../../finance/components/PointsManagementModal';
import { fetchCustomerAppointments, createAppointment } from '../../../lib/customerApi/appointments';
import { fetchCustomerReturns } from '../../../lib/customerApi/returns';
import WhatsAppMessageModal from './WhatsAppMessageModal';
import AppointmentModal from './forms/AppointmentModal';
import CallAnalyticsCard from './CallAnalyticsCard';

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
  
  // Customer status state
  const [customerStatus, setCustomerStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

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
      loadCustomerStatus();
    }
  }, [isOpen, customer?.id]);

  // Enhanced data fetching functions
  const loadEnhancedCustomerData = async () => {
    if (!customer?.id) return;
    
    setLoadingEnhancedData(true);
    try {
      // Set basic data
      setDevices(customer.devices || []);
      
      // Fetch payments from customer_payments table
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('payment_date', { ascending: false });

      if (!paymentsError && paymentsData) {
        // Transform payment data to match expected format
        const transformedPayments = paymentsData.map(payment => ({
          id: payment.id,
          customerId: payment.customer_id,
          deviceId: payment.device_id,
          amount: payment.amount,
          method: payment.method,
          type: payment.payment_type,
          status: payment.status,
          date: payment.payment_date,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }));
        setPayments(transformedPayments);
      } else {
        // Fallback to customer.payments if customer_payments table doesn't exist
        setPayments(customer.payments || []);
      }

      // Fetch POS sales with detailed items for this specific customer
      // Using simplified approach to avoid 400 errors
      const { data: posData, error: posError } = await supabase
        .from('lats_sales')
        .select(`
          id,
          sale_number,
          customer_id,
          subtotal,
          total_amount,
          payment_method,
          status,
          created_at,
          updated_at
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      let finalPosData = posData;
      let finalPosError = posError;

      if (posError) {
        console.warn('Complex customer detail sales query failed, trying simpler query:', posError.message);
        
        // Fallback to simpler query without joins
        const { data: simplePosData, error: simplePosError } = await supabase
          .from('lats_sales')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (simplePosError) {
          console.error('Simple customer detail sales query also failed:', simplePosError);
          finalPosData = [];
          finalPosError = null;
        } else {
          finalPosData = simplePosData;
          finalPosError = null;
          console.log(`✅ Loaded ${finalPosData?.length || 0} customer detail sales (without joins)`);
        }
      } else {
        console.log(`✅ Loaded ${finalPosData?.length || 0} customer detail sales`);
      }

      if (!finalPosError && finalPosData) {
        setPosSales(finalPosData);
        
        // Extract sale items (only if we have the complex data with sale items)
        if (finalPosData.length > 0 && finalPosData[0].lats_sale_items) {
          const allItems = finalPosData.flatMap((sale: any) => 
            (sale.lats_sale_items || []).map((item: any) => ({
              ...item,
              saleNumber: sale.sale_number,
              saleDate: sale.created_at,
              paymentMethod: sale.payment_method,
              saleStatus: sale.status
            }))
          );
          setSaleItems(allItems);
        } else {
          // If we only have simple data, set empty sale items
          setSaleItems([]);
        }
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

      // Fetch communication history from customer_communications table
      try {
        const { data: commData, error: commError } = await supabase
          .from('customer_communications')
          .select('*')
          .eq('customer_id', customer.id)
          .order('sent_at', { ascending: false })
          .limit(50);

        if (!commError && commData) {
          setCommunicationHistory(commData);
        } else {
          // Fallback to SMS logs if customer_communications table doesn't exist
          const { data: smsData, error: smsError } = await supabase
            .from('sms_logs')
            .select('*')
            .eq('phone_number', customer.phone?.replace(/\D/g, '') || '')
            .order('created_at', { ascending: false })
            .limit(50);

          if (!smsError && smsData) {
            // Transform SMS data to match communication history format
            const transformedSmsData = smsData.map(sms => ({
              id: sms.id,
              customer_id: customer.id,
              type: 'sms',
              message: sms.message,
              status: sms.status,
              phone_number: sms.phone_number,
              sent_by: sms.sent_by,
              sent_at: sms.sent_at || sms.created_at,
              created_at: sms.created_at
            }));
            setCommunicationHistory(transformedSmsData);
          }
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

  // Load customer status information
  const loadCustomerStatus = async () => {
    if (!customer?.id) return;
    
    setLoadingStatus(true);
    try {
      const status = await getCustomerStatus(customer.id);
      setCustomerStatus(status);
    } catch (error) {
      console.error('Error fetching customer status:', error);
      setCustomerStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };


  // Handle activity tracking for various actions
  const trackActivity = async (activityType: string) => {
    if (!customer?.id) return;
    
    try {
      await trackCustomerActivity(customer.id, activityType);
      // Refresh status after activity
      await loadCustomerStatus();
    } catch (error) {
      console.error('Error tracking activity:', error);
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
    
    // Calculate customer ranking based on spending (using TSH values)
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
              <p className="text-sm text-blue-600 font-medium">{customer.phone}</p>
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
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-indigo-700 uppercase tracking-wide mb-1">Calls</div>
                  <div className="text-lg font-bold text-indigo-900">
                    {loadingEnhancedData ? '...' : customer.totalCalls || 0}
                  </div>
                </div>
              </div>

              {/* Call Analytics Section */}
              <CallAnalyticsCard customer={customer} />
              
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
                        {customer.callLoyaltyLevel && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            customer.callLoyaltyLevel === 'VIP' ? 'bg-purple-500/20 text-purple-700' :
                            customer.callLoyaltyLevel === 'Gold' ? 'bg-yellow-500/20 text-yellow-700' :
                            customer.callLoyaltyLevel === 'Silver' ? 'bg-gray-500/20 text-gray-700' :
                            customer.callLoyaltyLevel === 'Bronze' ? 'bg-orange-500/20 text-orange-700' :
                            customer.callLoyaltyLevel === 'Basic' ? 'bg-blue-500/20 text-blue-700' :
                            'bg-green-500/20 text-green-700'
                          }`}>
                            <Phone size={10} />
                            {customer.callLoyaltyLevel}
                          </span>
                        )}
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
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium text-blue-600">{customer.phone || 'Not provided'}</span>
                      </div>
                      {customer.whatsapp && (
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">WhatsApp:</span>
                          <span className="text-sm font-medium text-green-600">{customer.whatsapp}</span>
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
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {customerStatus && (
                          <p className="text-xs text-gray-600 mt-1">
                            {customerStatus.statusReason}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Member Since</span>
                        <p className="text-sm font-medium text-gray-900">
                          {loadingStatus ? 'Loading...' : 
                           customerStatus ? customerStatus.memberSince :
                           customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 
                           customer.joinedDate ? new Date(customer.joinedDate).toLocaleDateString() : 
                           'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Last Visit</span>
                        <p className="text-sm font-medium text-gray-900">
                          {loadingStatus ? 'Loading...' : 
                           customerStatus ? customerStatus.lastVisit :
                           customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 
                           customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 
                           'Never'}
                        </p>
                        {customerStatus && customerStatus.daysSinceActivity !== null && (
                          <p className="text-xs text-gray-600">
                            {customerStatus.daysSinceActivity === 0 ? 'Today' :
                             customerStatus.daysSinceActivity === 1 ? '1 day ago' :
                             `${customerStatus.daysSinceActivity} days ago`}
                          </p>
                        )}
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

                  {/* Financial Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Spent</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {customer.totalSpent ? `Tsh ${customer.totalSpent.toLocaleString()}` : 'Tsh 0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Loyalty Points</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {customer.loyaltyPoints || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Purchase</span>
                        <span className="text-sm font-medium text-gray-900">
                          {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Quick Actions</h3>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowSmsModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send SMS
                      </button>
                      <button
                        onClick={() => setShowPointsModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Award className="w-4 h-4" />
                        Add Points
                      </button>
                      <button
                        onClick={() => setShowAppointmentModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Calendar className="w-4 h-4" />
                        Book Appointment
                      </button>
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

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowSmsModal(true);
                trackActivity('sms_opened');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
            
            <button
              onClick={() => {
                setShowWhatsAppModal(true);
                trackActivity('whatsapp_opened');
              }}
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
              onClick={() => {
                setShowCheckinModal(true);
                trackActivity('checkin_opened');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Check-in
            </button>

            <button
              onClick={() => {
                setShowAppointmentModal(true);
                trackActivity('appointment_modal_opened');
              }}
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
            
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
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
            try {
              const phoneNumber = customer.phone.replace(/\D/g, '');
              const result = await smsService.sendSMS(phoneNumber, smsMessage, customer.id);
              
              if (result.success) {
                // Log the SMS to the database
                const { error: logError } = await supabase
                  .from('sms_logs')
                  .insert({
                    phone_number: phoneNumber,
                    message: smsMessage,
                    status: 'sent',
                    sent_by: currentUser?.id,
                    device_id: null, // No specific device for general SMS
                    cost: null, // Cost not tracked for manual SMS
                    sent_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                  });

                if (logError) {
                  console.error('Error logging SMS:', logError);
                }

                // Also log to customer_communications table
                const { error: commError } = await supabase
                  .from('customer_communications')
                  .insert({
                    customer_id: customer.id,
                    type: 'sms',
                    message: smsMessage,
                    status: 'sent',
                    phone_number: phoneNumber,
                    sent_by: currentUser?.id,
                    sent_at: new Date().toISOString()
                  });

                if (commError) {
                  console.error('Error logging customer communication:', commError);
                }

                setSmsResult('SMS sent and logged successfully!');
                setSmsMessage('');
                
                // Refresh communication history
                loadAdditionalCustomerData();
              } else {
                setSmsResult(`Failed: ${result.error}`);
              }
            } catch (error) {
              console.error('SMS sending error:', error);
              setSmsResult('Failed to send SMS');
            } finally {
              setSmsSending(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-gray-700 mb-1 font-medium">To</label>
            <div className="py-2 px-4 bg-blue-50 text-blue-700 font-medium rounded">{customer.phone}</div>
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
              const { notes, referralSourceCustom, ...rest } = values;
              
              // Handle notes - if there are notes, add them as a new note
              if (notes && notes.trim()) {
                await addNote(customer.id, notes.trim());
              }
              
              // Handle referral source custom value
              const finalReferralSource = referralSourceCustom && referralSourceCustom.trim() 
                ? referralSourceCustom.trim() 
                : rest.referralSource;
              
              // Update customer with the rest of the data
              const updateData = {
                ...rest,
                referralSource: finalReferralSource
              };
              
              const success = await updateCustomer(customer.id, updateData);
              if (success) {
                setShowEditModal(false);
                // Refresh the customer data
                setCurrentCustomer(prev => ({ ...prev, ...updateData }));
                toast.success('Customer updated successfully!');
              } else {
                toast.error('Failed to update customer');
              }
            } catch (error) {
              console.error('Error updating customer:', error);
              toast.error('Failed to update customer');
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
            whatsapp: customer.whatsapp || customer.phone || '',
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
              <div className="text-green-600 font-bold text-center mb-4">
                Check-in successful! 20 points awarded.
                {customerStatus && !customerStatus.isActive && (
                  <div className="text-blue-600 text-sm mt-2">
                    Customer has been reactivated automatically.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center text-gray-700">
                  <p className="text-sm mb-2">Check in this customer:</p>
                  <p className="font-medium text-lg">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      setCheckinLoading(true);
                      try {
                        if (!currentUser?.id) throw new Error('No staff user.');
                        const resp = await checkInCustomerWithReactivation(customer.id, currentUser.id);
                        if (resp.success) {
                          setCheckinSuccess(true);
                          
                          // Show different messages based on whether customer was reactivated
                          if (resp.wasReactivated) {
                            toast.success('Customer checked in and reactivated! Points awarded.');
                          } else {
                            toast.success('Check-in successful! Points awarded.');
                          }
                          
                          // Refresh customer status after successful check-in
                          await loadCustomerStatus();
                          
                          // Update the current customer state to reflect reactivation
                          setCurrentCustomer(prev => ({
                            ...prev,
                            isActive: true,
                            lastVisit: new Date().toISOString()
                          }));
                        } else {
                          toast.error(resp.message);
                        }
                      } catch (e: any) {
                        console.error('Check-in failed:', e);
                        toast.error('Check-in failed: ' + (e.message || 'Unknown error'));
                      } finally {
                        setCheckinLoading(false);
                      }
                    }}
                    disabled={checkinLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
                  >
                    {checkinLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Checking in...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Check In Customer
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowCheckinModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppMessageModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        customer={customer}
        onMessageSent={() => {
          // Refresh communication history
          loadAdditionalCustomerData();
        }}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        customer={customer}
        mode="create"
        onSave={async (appointmentData) => {
          try {
            await createAppointment(appointmentData);
            // Refresh appointments
            await loadAdditionalCustomerData();
            // Refresh customer status
            await loadCustomerStatus();
            // Track activity
            await trackActivity('appointment_created');
          } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
          }
        }}
      />

      {/* Customer Preferences Modal */}
      <Modal isOpen={showPreferencesModal} onClose={() => setShowPreferencesModal(false)} title="Customer Preferences" maxWidth="md">
        <div className="p-6 space-y-6">
          <form id="preferences-form">
            {customerPreferences ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
                    <select 
                      name="preferred_contact_method"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={customerPreferences.preferred_contact_method || 'whatsapp'}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                      <option value="phone">Phone Call</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select 
                      name="language"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={customerPreferences.language || 'en'}
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="repair_updates"
                        defaultChecked={customerPreferences.notification_preferences?.repair_updates} 
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-700">Repair Updates</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="appointment_reminders"
                        defaultChecked={customerPreferences.notification_preferences?.appointment_reminders} 
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-700">Appointment Reminders</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="promotions"
                        defaultChecked={customerPreferences.notification_preferences?.promotions} 
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-700">Promotions</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quiet Hours</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="time" 
                      name="quiet_start"
                      defaultValue={customerPreferences.quiet_hours?.start || '22:00'}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="flex items-center justify-center text-gray-500">to</span>
                    <input 
                      type="time" 
                      name="quiet_end"
                      defaultValue={customerPreferences.quiet_hours?.end || '08:00'}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No preferences set for this customer</p>
                <p className="text-sm">Preferences will be created when first saved</p>
              </div>
            )}
          </form>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowPreferencesModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  // Get form data from the modal
                  const form = document.querySelector('#preferences-form') as HTMLFormElement;
                  if (!form) {
                    toast.error('Form not found');
                    return;
                  }
                  
                  const formData = new FormData(form);
                  const preferences = {
                    customer_id: customer.id,
                    preferred_contact_method: formData.get('preferred_contact_method') as string || 'whatsapp',
                    language: formData.get('language') as string || 'en',
                    notification_preferences: {
                      repair_updates: formData.get('repair_updates') === 'on',
                      appointment_reminders: formData.get('appointment_reminders') === 'on',
                      promotions: formData.get('promotions') === 'on'
                    },
                    quiet_hours: {
                      start: formData.get('quiet_start') as string || '22:00',
                      end: formData.get('quiet_end') as string || '08:00'
                    }
                  };

                  // Save or update customer preferences
                  const { error } = await supabase
                    .from('customer_preferences')
                    .upsert(preferences, { 
                      onConflict: 'customer_id',
                      ignoreDuplicates: false 
                    });

                  if (error) {
                    console.error('Error saving preferences:', error);
                    toast.error('Failed to save preferences');
                    return;
                  }

                  toast.success('Preferences saved successfully!');
                  setShowPreferencesModal(false);
                  
                  // Refresh customer preferences
                  await loadAdditionalCustomerData();
                } catch (error) {
                  console.error('Error saving preferences:', error);
                  toast.error('Failed to save preferences');
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetailModal;
