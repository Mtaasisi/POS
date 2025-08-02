import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useCustomers } from '../context/CustomersContext';
import { useDevices } from '../context/DevicesContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Star, MessageSquare, Smartphone, CreditCard, Gift, Users, Tag, Bell, BarChart2, PieChart } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { toast } from 'react-hot-toast';
import CustomerForm from '../components/forms/CustomerForm';
import { formatCurrency } from '../lib/customerApi';
import DeviceCard from '../components/DeviceCard';
import { smsService } from '../services/smsService';
import PointsManagementModal from '../components/PointsManagementModal';
import CustomerAnalytics from '../components/CustomerAnalytics';
import CommunicationHub from '../components/CommunicationHub';
import { fetchAllDevices } from '../lib/deviceApi';
import { usePayments } from '../context/PaymentsContext';
import { calculatePointsForDevice } from '../lib/pointsConfig';
import { fetchAllCustomers } from '../lib/customerApi';
import { Customer, Device, Payment } from '../types';
import { whatsappService } from '../services/whatsappService';
import { QRCodeSVG } from 'qrcode.react';
import BarcodeScanner from '../components/BarcodeScanner';
import { checkInCustomer } from '../lib/customerApi';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center bg-white/30 rounded-xl p-4 min-w-[120px]">
    <div className="mb-2">{icon}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNote, updateCustomer, markCustomerAsRead } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showCommunicationHub, setShowCommunicationHub] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('Dear customer, this is a friendly reminder regarding your device/service. Please contact us if you have any questions.');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState<string | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const { currentUser } = useAuth();



  // Fetch comprehensive customer data
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        if (navigator.onLine) {
          // Fetch all customers data (includes devices, payments, notes, promotions)
          const allCustomers = await fetchAllCustomers();
          const customerData = allCustomers.find(c => c.id === id);
          
          if (!customerData) {
            setError('Customer not found');
            return;
          }
          
          setCustomer(customerData);
          setDevices(customerData.devices || []);
          setPayments(customerData.payments || []);
          await markCustomerAsRead(customerData.id); // Mark as read when data is loaded
        } else {
          // Fallback to cached data
          const cachedCustomers = await import('../lib/offlineCache').then(m => m.cacheGetAll('customers'));
          const customerData = cachedCustomers.find((c: any) => c.id === id);
          
          if (customerData) {
            setCustomer(customerData);
            setDevices(customerData.devices || []);
            setPayments(customerData.payments || []);
            await markCustomerAsRead(customerData.id); // Mark as read when data is loaded
          } else {
            setError('Customer not found in cache');
          }
        }
      } catch (err: any) {
        console.error('Error loading customer data:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id]);

  // Add a helper to reload customer data
  const reloadCustomerData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const allCustomers = await fetchAllCustomers();
      const customerData = allCustomers.find(c => c.id === id);
      if (customerData) {
        setCustomer(customerData);
        setDevices(customerData.devices || []);
        setPayments(customerData.payments || []);
        await markCustomerAsRead(customerData.id); // Mark as read when data is loaded
      }
    } catch (e) {
      setError('Failed to reload customer data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link to="/customers" className="mr-4 text-gray-700 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        </div>
        <GlassCard>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error || 'Customer not found'}</div>
            <GlassButton onClick={() => navigate('/customers')}>Back to Customers</GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }
  
  // Sort devices by expectedReturnDate ascending (upcoming first)
  const sortedDevices = [...devices].sort((a, b) => {
    if (!a.expectedReturnDate) return 1;
    if (!b.expectedReturnDate) return -1;
    return a.expectedReturnDate.localeCompare(b.expectedReturnDate);
  });

  // Calculate statistics
  const totalSpent = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const points = customer.points || 0;
  const repairs = devices.length;
  const referrals = customer.referrals?.length || 0;
  
  // Helper: get total paid for a device
  const getDeviceTotalPaid = (deviceId: string) => {
    return payments.filter(p => p.deviceId === deviceId && p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };
  
  const promoHistory = customer.promoHistory || [];

  // Spending by year (for bar chart)
  const spendingByYear: Record<string, number> = {};
  payments.forEach(p => {
    const year = new Date(p.date).getFullYear();
    spendingByYear[year] = (spendingByYear[year] || 0) + p.amount;
  });
  const spendingBarData = Object.entries(spendingByYear).map(([year, amount]) => ({ year, amount }));

  // Repairs by status (for pie chart)
  const statusCounts: Record<string, number> = {};
  devices.forEach(d => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
  });
  const statusPieData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // Handler for updating customer
  const handleUpdateCustomer = async (values: Partial<typeof customer>) => {
    // This function is no longer needed as edit is removed
  };

  // Simple bar chart (SVG)
  const BarChart = ({ data }: { data: { year: string; amount: number }[] }) => {
    const max = Math.max(...data.map(d => d.amount), 1);
    return (
      <svg width={180} height={80} className="block">
        {data.map((d, i) => (
          <g key={d.year}>
            <rect x={i * 35 + 10} y={80 - (d.amount / max) * 60} width={20} height={(d.amount / max) * 60} fill="#60a5fa" rx={4} />
            <text x={i * 35 + 20} y={75} fontSize={10} textAnchor="middle">{d.year}</text>
          </g>
        ))}
      </svg>
    );
  };

  // Simple pie chart (SVG)
  const PieChartSimple = ({ data }: { data: { status: string; count: number }[] }) => {
    const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
    let acc = 0;
    const colors = ['#60a5fa', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6'];
    return (
      <svg width={80} height={80} viewBox="0 0 32 32">
        {data.map((d, i) => {
          const start = acc / total * 2 * Math.PI;
          acc += d.count;
          const end = acc / total * 2 * Math.PI;
          const x1 = 16 + 16 * Math.sin(start);
          const y1 = 16 - 16 * Math.cos(start);
          const x2 = 16 + 16 * Math.sin(end);
          const y2 = 16 - 16 * Math.cos(end);
          const large = end - start > Math.PI ? 1 : 0;
          return (
            <path
              key={d.status}
              d={`M16,16 L${x1},${y1} A16,16 0 ${large} 1 ${x2},${y2} Z`}
              fill={colors[i % colors.length]}
              stroke="#fff"
              strokeWidth={0.5}
            />
          );
        })}
      </svg>
    );
  };

  const reminderTemplates = [
    {
      label: 'Device Ready for Pickup',
      value: 'Hi {customerName}, your device{deviceModel} is ready for pickup. Please visit us at your convenience.'
    },
    {
      label: 'Payment Due',
      value: 'Dear {customerName}, this is a reminder that payment for your device{deviceModel} is due. Please contact us if you have any questions.'
    },
    {
      label: 'Service Follow-up',
      value: 'Hello {customerName}, we hope your device{deviceModel} is working well. Please let us know if you need any further assistance.'
    }
  ];

  // Helper to check if last check-in is today
  const isCheckedInToday = Boolean(customer?.lastVisit && new Date(customer.lastVisit).toDateString() === new Date().toDateString());

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center mb-4">
        <Link to="/customers" className="mr-4 text-gray-700 hover:text-gray-900">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
      </div>

      {isOffline && (
        <div style={{ background: '#fbbf24', color: 'black', padding: '8px', textAlign: 'center' }}>
          You are offline. Data is loaded from cache.
        </div>
      )}

      {/* Customer Info Card - Redesigned */}
      <GlassCard className="mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Section - Customer Profile */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-white/30">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{customer.name}</h2>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${customer.colorTag === 'vip' ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30' : customer.colorTag === 'complainer' ? 'bg-rose-500/20 text-rose-700 border border-rose-500/30' : customer.colorTag === 'purchased' ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' : customer.colorTag === 'new' ? 'bg-purple-500/20 text-purple-700 border border-purple-500/30' : 'bg-gray-500/20 text-gray-700 border border-gray-500/30'}`}>
                    <Tag size={14} />
                    <span className="capitalize">{customer.colorTag}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-700 border border-amber-500/30">
                    <Star size={14} />
                    <span className="capitalize">{customer.loyaltyLevel}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                    <Gift size={14} />
                    <span>{points} pts</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Customer since {customer.joinedDate ? new Date(customer.joinedDate).getFullYear() : 'N/A'}</span>
                  <span>•</span>
                  <span>Last visit: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}</span>
                  {isCheckedInToday && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Checked in today</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-blue-500" />
                      <span className="font-medium">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`tel:${customer.phone}`)}
                        className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                        title="Call Customer"
                      >
                        <Phone size={14} />
                      </button>
                      <button
                        onClick={() => setShowSmsModal(true)}
                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                        title="Send SMS"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Email hidden for privacy */}
                  <div className="flex items-center justify-between p-2 bg-white/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <span>{customer.whatsapp || 'Not provided'}</span>
                    </div>
                    {customer.whatsapp && customer.whatsapp !== 'Not provided' && customer.whatsapp.trim() !== '' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`https://wa.me/${customer.whatsapp?.replace(/\D/g, '')}`)}
                          className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                          title="Open WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white/20 rounded-lg">
                    <MapPin size={16} className="text-purple-500" />
                    <span>{customer.city}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Personal Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-white/20 rounded-lg">
                    <Users size={16} className="text-indigo-500" />
                    <span className="capitalize">{customer.gender || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white/20 rounded-lg">
                    <Calendar size={16} className="text-pink-500" />
                    <span>{customer.birthMonth && customer.birthDay ? `${customer.birthMonth} ${customer.birthDay}` : 'Not provided'}</span>
                    {(customer.birthMonth || customer.birthDay) && (
                      <span className="ml-auto px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">Birthday</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white/20 rounded-lg">
                    <Tag size={16} className="text-orange-500" />
                    <span>{customer.referralSource || 'Not provided'}</span>
                    {customer.referralSource && (
                      <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Referral</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white/20 rounded-lg">
                    <Users size={16} className="text-emerald-500" />
                    <span>{referrals} referrals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Quick Actions */}
          <div className="lg:w-80">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/20">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <GlassButton
                  className="w-full justify-start bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Profile
                </GlassButton>
                <GlassButton
                  className="w-full justify-start bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                  onClick={() => setShowPointsModal(true)}
                >
                  Manage Points
                </GlassButton>
                <GlassButton 
                  variant="secondary" 
                  size="sm" 
                  onClick={async () => {
                    setCheckinLoading(true);
                    try {
                      if (!currentUser?.id) throw new Error('No staff user.');
                      const resp = await checkInCustomer(customer.id, currentUser.id);
                      if (resp.success) {
                        setCheckinSuccess(true);
                        await reloadCustomerData();
                        toast.success('Check-in successful! Points awarded.');
                      } else {
                        toast.error(resp.message);
                      }
                    } catch (e: any) {
                      toast.error('Check-in failed: ' + (e.message || e));
                    } finally {
                      setCheckinLoading(false);
                    }
                  }}
                  className="w-full justify-start mt-2"
                  disabled={isCheckedInToday}
                >
                  Manual Check-in
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
            </GlassCard>

      {/* Enhanced Customer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard className="bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-600">Birthday</p>
              <p className="text-2xl font-bold text-pink-900">
                {customer.birthMonth && customer.birthDay ? `${customer.birthMonth} ${customer.birthDay}` : 'Not Set'}
              </p>
            </div>
            <div className="p-3 bg-pink-50/20 rounded-full">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Referral Source</p>
              <p className="text-lg font-bold text-purple-900">
                {customer.referralSource || 'Not Set'}
              </p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">WhatsApp</p>
              <p className="text-lg font-bold text-green-900">
                {customer.whatsapp ? 'Connected' : 'Not Set'}
              </p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total Returns</p>
              <p className="text-2xl font-bold text-orange-900">
                {customer.totalReturns || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-50/20 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Customer Analytics - moved to top */}
      <CustomerAnalytics customer={customer} devices={devices} payments={payments.map(p => ({
          id: p.id,
          customer_id: customer.id,
          amount: p.amount,
          method: p.method,
          device_id: p.deviceId,
          payment_date: p.date,
          payment_type: p.type,
          status: p.status,
          created_by: p.createdBy,
          created_at: p.createdAt
        }))} />

      {/* Notes and Additional Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes Card */}
        <GlassCard>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
          <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
            {customer.notes?.map(note => (
              <div key={note.id} className="p-2 bg-white/30 rounded">
                <div className="text-gray-900 text-sm">{note.content}</div>
                <div className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {(!customer.notes || customer.notes.length === 0) && <div className="text-xs text-gray-500">No notes yet</div>}
          </div>
        </GlassCard>
        
        {/* Additional Actions Card */}
        <GlassCard>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Actions</h3>
          <div className="space-y-2">
            <GlassButton className="w-full justify-start" variant="secondary" icon={<Smartphone size={18} />} onClick={() => navigate('/devices/new')}>New Device Intake</GlassButton>
            <GlassButton className="w-full justify-start" variant="secondary" icon={<CreditCard size={18} />}>Record Payment</GlassButton>
            <GlassButton className="w-full justify-start" variant="secondary" icon={<Bell size={18} />} onClick={() => setShowReminderModal(true)}>
              Send Reminder
            </GlassButton>
            <GlassButton className="w-full justify-start" variant="secondary" icon={<MessageSquare size={18} />} onClick={() => setShowCommunicationHub(true)}>Communication Hub</GlassButton>
          </div>
        </GlassCard>
      </div>



      {/* Repair History Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
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
              <tr className="bg-white/20">
                <th className="px-2 py-2 text-left">Device</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Issue</th>
                <th className="px-2 py-2 text-left">Created</th>
                <th className="px-2 py-2 text-left">Expected Return</th>
                <th className="px-2 py-2 text-left">Total Paid</th>
                <th className="px-2 py-2 text-left">Points Earned</th>
                <th className="px-2 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map(device => (
                <tr key={device.id} className="hover:bg-white/40 cursor-pointer" onClick={() => navigate(`/devices/${device.id}`)}>
                  <td className="px-2 py-2">
                    <div>
                      <div className="font-medium">{device.brand} {device.model}</div>
                      <div className="text-xs text-gray-500">{device.serialNumber || 'No serial'}</div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === 'done' ? 'bg-green-100 text-green-800' :
                      device.status === 'failed' ? 'bg-red-100 text-red-800' :
                      ['assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing'].includes(device.status) ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {device.status.replace(/-/g, ' ')}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="max-w-xs truncate" title={device.issueDescription}>
                      {device.issueDescription}
                    </div>
                  </td>
                  <td className="px-2 py-2">{new Date(device.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2">
                    {device.expectedReturnDate ? new Date(device.expectedReturnDate).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="px-2 py-2">
                    {formatCurrency(getDeviceTotalPaid(device.id))}
                  </td>
                  <td className="px-2 py-2">
                    {calculatePointsForDevice(device, customer.loyaltyLevel)}
                  </td>
                  <td className="px-2 py-2">
                    <GlassButton size="sm" variant="secondary" onClick={() => navigate(`/devices/${device.id}`)}>
                      View
                    </GlassButton>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-500 py-4">No repair history found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Financial History Table */}
      <GlassCard>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/20">
                <th className="px-2 py-2 text-left">Date</th>
                <th className="px-2 py-2 text-left">Type</th>
                <th className="px-2 py-2 text-left">Amount</th>
                <th className="px-2 py-2 text-left">Device</th>
                <th className="px-2 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
                             {payments.map(payment => (
                 <tr key={payment.id} className="hover:bg-white/40">
                   <td className="px-2 py-2">{new Date(payment.date).toLocaleDateString()}</td>
                   <td className="px-2 py-2">{payment.type}</td>
                   <td className="px-2 py-2">{formatCurrency(payment.amount)}</td>
                                       <td className="px-2 py-2 max-w-32 truncate" title={payment.deviceId}>{payment.deviceId}</td>
                   <td className="px-2 py-2">{payment.status}</td>
                 </tr>
               ))}
              {payments.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-500 py-4">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Promotions Table */}
      <GlassCard>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Promotions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/20">
                <th className="px-2 py-2 text-left">Title</th>
                <th className="px-2 py-2 text-left">Content</th>
                <th className="px-2 py-2 text-left">Sent At</th>
                <th className="px-2 py-2 text-left">Via</th>
                <th className="px-2 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {promoHistory.map(promo => (
                <tr key={promo.id} className="hover:bg-white/40">
                  <td className="px-2 py-2">{promo.title}</td>
                  <td className="px-2 py-2">{promo.content}</td>
                  <td className="px-2 py-2">{new Date(promo.sentAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2">{promo.sentVia}</td>
                  <td className="px-2 py-2">{promo.status}</td>
                </tr>
              ))}
              {promoHistory.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-500 py-4">No promotions sent yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

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
        currentPoints={points}
        loyaltyLevel={customer.loyaltyLevel}
        onPointsUpdated={(newPoints: number) => {
          updateCustomer(customer.id, { points: newPoints });
        }}
      />

      {/* Communication Hub Modal */}
      <CommunicationHub
        isOpen={showCommunicationHub}
        onClose={() => setShowCommunicationHub(false)}
        customerId={customer.id}
        customerName={customer.name}
      />

      {/* Reminder Modal */}
      <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} title="Send Customer Reminder">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedTemplate}
              onChange={e => {
                setSelectedTemplate(e.target.value);
                if (e.target.value) {
                  const template = reminderTemplates.find(t => t.label === e.target.value);
                  if (template) {
                    const deviceModel = customer.devices && customer.devices.length > 0 ? ` (${customer.devices[0].brand} ${customer.devices[0].model})` : '';
                    setReminderMessage(
                      template.value
                        .replace('{customerName}', customer.name)
                        .replace('{deviceModel}', deviceModel)
                    );
                  }
                }
              }}
            >
              <option value="">-- Select a template --</option>
              {reminderTemplates.map(t => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows={4}
            value={reminderMessage}
            onChange={e => setReminderMessage(e.target.value)}
            placeholder="Type your reminder message..."
            disabled={sendingReminder}
          />
          <div className="flex justify-end gap-2">
            <GlassButton variant="secondary" onClick={() => setShowReminderModal(false)} disabled={sendingReminder}>Cancel</GlassButton>
            <GlassButton
              variant="primary"
              disabled={sendingReminder || !reminderMessage.trim()}
              onClick={async () => {
                setSendingReminder(true);
                try {
                  await smsService.sendSMS(customer.phone, reminderMessage);
                  toast.success('Reminder sent successfully!');
                  setShowReminderModal(false);
                } catch (err) {
                  toast.error('Failed to send reminder.');
                } finally {
                  setSendingReminder(false);
                }
              }}
            >
              {sendingReminder ? 'Sending...' : 'Send'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer" maxWidth="lg">
        {/* Debug: Show initialValues for autofill */}
        {/* <pre style={{ background: '#f3f4f6', color: '#111', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
          {JSON.stringify({
            id: customer.id,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            gender: customer.gender === 'male' || customer.gender === 'female' ? customer.gender : 'male',
            city: customer.city || '',
            whatsapp: customer.whatsapp || customer.phone || '',
            referralSource: customer.referralSource || '',
            birthMonth: customer.birthMonth || '',
            birthDay: customer.birthDay || '',
            notes: Array.isArray(customer.notes) && customer.notes.length > 0 ? customer.notes[customer.notes.length - 1].content : (typeof customer.notes === 'string' ? customer.notes : ''),
            customerTag: customer.colorTag || 'new',
          }, null, 2)}
        </pre> */}
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
            whatsapp: customer.whatsapp || customer.phone || '',
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
                        await reloadCustomerData();
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

export default CustomerDetailPage; 