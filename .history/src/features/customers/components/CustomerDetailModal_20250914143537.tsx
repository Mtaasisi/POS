import React, { useState, useEffect } from 'react';
import { 
  X, Users, Phone, Mail, MapPin, Calendar, Star, MessageSquare, 
  Smartphone, CreditCard, Gift, Tag, Bell, BarChart2, PieChart, 
  ShoppingBag, Wrench, TrendingUp, DollarSign, Package, Clock, 
  AlertTriangle, CheckCircle, XCircle, Info, Edit, QrCode, 
  Copy, Download, Share2, History, Building, Target, Percent, 
  Calculator, Banknote, Receipt, Layers, FileText
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

  // Update current customer when prop changes
  useEffect(() => {
    setCurrentCustomer(customer);
  }, [customer]);

  // Load enhanced customer data
  useEffect(() => {
    if (isOpen && customer?.id) {
      loadEnhancedCustomerData();
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
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'devices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Devices
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
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
              {customerAnalytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Spent</div>
                    <div className="text-lg font-bold text-emerald-900">{formatCurrency(customerAnalytics.totalSpent)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Orders</div>
                    <div className="text-lg font-bold text-blue-900">{posSales.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Devices</div>
                    <div className="text-lg font-bold text-orange-900">{devices.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Points</div>
                    <div className="text-lg font-bold text-purple-900">{customer.points || 0}</div>
                  </div>
                </div>
              )}
              
              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Customer Info */}
                <div className="space-y-6">
                  {/* Customer Avatar & Basic Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-white/30">
                      <Users className="w-8 h-8 text-blue-600" />
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
                      </div>
                    </div>
                  </div>
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSmsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
            
            <button
              onClick={() => setShowPointsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              <Gift className="w-4 h-4" />
              Points
            </button>

            <button
              onClick={() => setShowCheckinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Check-in
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
            
            {onEdit && (
              <button
                onClick={() => onEdit(customer)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
