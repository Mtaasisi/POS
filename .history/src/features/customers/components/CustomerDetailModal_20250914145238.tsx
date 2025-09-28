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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Sales Performance */}
              {customerAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Spent</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(customerAnalytics.totalSpent)}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          POS: {formatCurrency(customerAnalytics.totalPosSpent)} | Device: {formatCurrency(customerAnalytics.totalDeviceSpent)} | Parts: {formatCurrency(customerAnalytics.totalSpareSpent)}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50/20 rounded-full">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Purchase History</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {posSales.length} orders
                        </p>
                        <p className="text-xs text-purple-700 mt-1">
                          {customerAnalytics.uniqueProducts} unique products | {customerAnalytics.totalItems} items
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50/20 rounded-full">
                        <ShoppingBag className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-600">Average Order</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {formatCurrency(customerAnalytics.averageOrderValue)}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          {customerAnalytics.purchaseFrequency.toFixed(1)} orders/month
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50/20 rounded-full">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-600">Last Purchase</p>
                        <p className="text-lg font-bold text-amber-900">
                          {customerAnalytics.lastPurchaseDate ? 
                            new Date(customerAnalytics.lastPurchaseDate).toLocaleDateString() : 
                            'No purchases'
                          }
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {customerAnalytics.daysSinceLastPurchase ? 
                            `${customerAnalytics.daysSinceLastPurchase} days ago` : 
                            'New customer'
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-amber-50/20 rounded-full">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Insights */}
              {customerAnalytics && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <BarChart2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Customer Insights</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Purchase Behavior</h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>• {customerAnalytics.purchaseFrequency.toFixed(1)} orders per month</div>
                        <div>• Average order: {formatCurrency(customerAnalytics.averageOrderValue)}</div>
                        <div>• {customerAnalytics.uniqueProducts} unique products purchased</div>
                        {customerAnalytics.daysSinceLastPurchase && (
                          <div>• Last purchase: {customerAnalytics.daysSinceLastPurchase} days ago</div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">Repair Profile</h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>• {devices.length} total devices</div>
                        <div>• {devices.filter(d => d.status === 'done').length} completed repairs</div>
                        <div>• {devices.filter(d => d.status === 'failed').length} failed repairs</div>
                        <div>• {devices.filter(d => ['assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing'].includes(d.status)).length} active repairs</div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">Financial Summary</h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>• Total spent: {formatCurrency(customerAnalytics.totalSpent)}</div>
                        <div>• POS purchases: {formatCurrency(customerAnalytics.totalPosSpent)}</div>
                        <div>• Device revenue: {formatCurrency(customerAnalytics.totalDeviceSpent)}</div>
                        <div>• Spare parts: {formatCurrency(customerAnalytics.totalSpareSpent)}</div>
                        <div>• Current points: {customer.points} pts</div>
                        <div>• Customer ranking: {customerAnalytics.customerRanking}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Repair History</h3>
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
                        <th className="text-left p-3 font-medium text-gray-700">Expected Return</th>
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
                              {device.expectedReturnDate ? new Date(device.expectedReturnDate).toLocaleDateString() : 'Not set'}
                            </td>
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
                        <tr><td colSpan={7} className="text-center text-gray-500 py-4">No repair history found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-700">Date</th>
                        <th className="text-left p-3 font-medium text-gray-700">Type</th>
                        <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                        <th className="text-left p-3 font-medium text-gray-700">Currency</th>
                        <th className="text-left p-3 font-medium text-gray-700">Device</th>
                        <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">{new Date(payment.date).toLocaleDateString()}</td>
                          <td className="p-3">{payment.type}</td>
                          <td className="p-3">{formatCurrency(payment.amount)}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {payment.currency || 'TZS'}
                            </span>
                          </td>
                          <td className="p-3 max-w-32 truncate" title={payment.deviceId}>{payment.deviceId}</td>
                          <td className="p-3">{payment.status}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-gray-500 py-4">No payments found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* POS Sales History */}
              {posSales.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">POS Purchase History</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ShoppingBag size={16} />
                      <span>{posSales.length} orders</span>
                      <span>•</span>
                      <span>{saleItems.length} items</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 font-medium text-gray-700">Date</th>
                          <th className="text-left p-3 font-medium text-gray-700">Order #</th>
                          <th className="text-left p-3 font-medium text-gray-700">Items</th>
                          <th className="text-left p-3 font-medium text-gray-700">Total</th>
                          <th className="text-left p-3 font-medium text-gray-700">Payment</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posSales.map(sale => (
                          <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">{new Date(sale.created_at).toLocaleDateString()}</td>
                            <td className="p-3 font-mono text-xs">{sale.sale_number}</td>
                            <td className="p-3">
                              <div className="max-w-48">
                                {sale.lats_sale_items?.slice(0, 2).map((item: any, index: number) => (
                                  <div key={index} className="text-xs text-gray-600">
                                    {item.lats_products?.name} {item.lats_product_variants?.name} (x{item.quantity})
                                  </div>
                                ))}
                                {sale.lats_sale_items?.length > 2 && (
                                  <div className="text-xs text-gray-500">+{sale.lats_sale_items.length - 2} more items</div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-medium">{formatCurrency(sale.total_amount)}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                                sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sale.payment_method}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                                sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {sale.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
