import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useDevices } from '../../../../context/DevicesContext';
import { useCustomers } from '../../../../context/CustomersContext';
import { useUserGoals } from '../../../../context/UserGoalsContext';
import { supabase } from '../../../../lib/supabaseClient';
import GlassCard from '../ui/GlassCard';
import DeviceCard from '../DeviceCard';
import { removeDuplicateDevices } from '../DeviceCard';
import SearchBar from '../ui/SearchBar';
import BarcodeScanner from '../../../devices/components/BarcodeScanner';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Smartphone, CheckCircle, UserCheck, QrCode, Hammer, PackageCheck, Wrench, XCircle, Clock, AlertTriangle, TrendingUp, Calendar, Users, Phone, Mail, MessageSquare, ClipboardList, Trophy, Star, Gift, Clock as ClockIcon, Users as UsersIcon, Check, ArrowUpDown, ArrowUp, ArrowDown, Settings } from 'lucide-react';

import { DeviceStatus, Device } from '../../../types';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import GlassButton from '../ui/GlassButton';


interface CustomerCareDashboardProps {
  devices: Device[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | DeviceStatus;
  setStatusFilter: (status: 'all' | DeviceStatus) => void;
}

const CustomerCareDashboard: React.FC<CustomerCareDashboardProps> = ({
  devices,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}) => {
  const { currentUser } = useAuth();
  const { getDevicesDueToday, getOverdueDevices, addRemark } = useDevices();
  const { customers, addPoints } = useCustomers();
  const { userGoals, getGoalProgress } = useUserGoals();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showReadyHandoverModal, setShowReadyHandoverModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showReturnedCCModal, setShowReturnedCCModal] = useState(false);
  const [showCompletedTodayModal, setShowCompletedTodayModal] = useState(false);
  const [showTotalCustomersModal, setShowTotalCustomersModal] = useState(false);
  // Add state for expanding the top card
  const [expanded, setExpanded] = useState(false);
  // Add state for device detail modal
  const [showDeviceDetailModal, setShowDeviceDetailModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  // Add state for showing all devices
  const [showAllDevices, setShowAllDevices] = useState(false);
  
  // Add state for goals management modal

  
  // Add sorting state
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'brand' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- New: Customers registered today by this staff ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const newCustomersToday: any[] = useMemo(() =>
    (customers || []).filter((c: any) => c.joinedDate.slice(0, 10) === todayStr),
    [customers, todayStr]
  );
  // --- New: Daily goal ---
  const [dailyGoal, setDailyGoal] = useState(5);
  const [progress, setProgress] = useState(0);
  
  // Get user-specific daily goal and progress
  useEffect(() => {
    const fetchUserGoal = async () => {
      if (currentUser?.id) {
        const goalProgress = await getGoalProgress('new_customers');
        setDailyGoal(goalProgress.goal);
        setProgress(goalProgress.progress);
      }
    };
    fetchUserGoal();
  }, [currentUser?.id, getGoalProgress]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger a refresh by updating the component
      console.log('Auto-refreshing dashboard data...');
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Setup real-time subscriptions for diagnostic requests
  useEffect(() => {
    if (!currentUser?.id) return;

    // Subscribe to diagnostic requests created by this user
    const diagnosticRequestsSubscription = supabase
      .channel('customer-care-dashboard-diagnostic-requests')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'diagnostic_requests',
          filter: `created_by=eq.${currentUser.id}`
        },
        (payload: any) => {
          console.log('🔔 Dashboard: Diagnostic request update received:', payload);
          if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
            const statusText = getDiagnosticStatusText(payload.new?.status);
            toast.success(`Diagnostic request "${payload.new?.title}" status updated to ${statusText}`, {
              icon: '🔧',
              duration: 4000
            });
          }
        }
      )
      .subscribe();

    return () => {
      diagnosticRequestsSubscription.unsubscribe();
    };
  }, [currentUser?.id]);

  const getDiagnosticStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'submitted_for_review':
        return 'Submitted for Review';
      case 'repair_required':
        return 'Repair Required';
      case 'replacement_required':
        return 'Replacement Required';
      case 'no_action_required':
        return 'No Action Required';
      case 'escalated':
        return 'Escalated';
      case 'admin_reviewed':
        return 'Admin Reviewed';
      default:
        return 'Unknown';
    }
  };

  // --- New: Devices received today by this staff (if tracked) ---
  // For now, just show all devices created today
  const devicesToday = useMemo(() =>
    devices.filter(d => d.createdAt && d.createdAt.slice(0, 10) === todayStr),
    [devices, todayStr]
  );

  // --- New: Check-in modal state ---
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinCustomer, setCheckinCustomer] = useState<any>(null);
  const [checkinPoints, setCheckinPoints] = useState(5);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // --- New: Check-in stats ---
  // For demo, count notes with 'checked in' in content for today
  const checkinStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (customers || []).forEach(c => {
      const todayNotes = (c.notes || []).filter(n => n.content.toLowerCase().includes('checked in') && n.createdAt.slice(0, 10) === todayStr);
      if (todayNotes.length > 0) stats[c.id] = todayNotes.length;
    });
    return stats;
  }, [customers, todayStr]);

  // --- New: Handle check-in ---
  const handleCheckin = async (customer: any) => {
    setCheckinCustomer(customer);
    setShowCheckinModal(true);
    setCheckinPoints(5);
  };
  const confirmCheckin = async () => {
    if (!checkinCustomer) return;
    setCheckinLoading(true);
    await addPoints(checkinCustomer.id, checkinPoints, 'Customer checked in at shop');
    setCheckinLoading(false);
    setShowCheckinModal(false);
  };

  // Sorting function
  const sortDevices = (devices: Device[]) => {
    return devices.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.createdAt || '').getTime();
          const dateB = new Date(b.createdAt || '').getTime();
          comparison = dateA - dateB;
          break;
        case 'customer':
          comparison = (a.customerName || '').localeCompare(b.customerName || '');
          break;
        case 'brand':
          const brandA = `${a.brand} ${a.model}`.toLowerCase();
          const brandB = `${b.brand} ${b.model}`.toLowerCase();
          comparison = brandA.localeCompare(brandB);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Daily motivation function
  const getDailyMotivation = () => {
    const motivations = [
      "Leo ni siku nzuri ya kusaidia wateja wako!",
      "Kila mteja ni fursa ya kujenga uhusiano mzuri.",
      "Ukarimu wako unaweza kubadilisha siku ya mtu.",
      "Kumbuka: wateja wako ni sababu ya kazi yako.",
      "Leo fanya kazi kama kila mteja ni muhimu sana.",
      "Upatikanaji wako unaweza kuwa tofauti kwa mtu.",
      "Kila simu, kila ujumbe - unaweza kubadilisha siku.",
      "Wateja wako wanategemea uwezo wako wa kuwasaidia.",
      "Leo ni siku ya kujenga ujasiri wa wateja.",
      "Kumbuka: wewe ni muhimu kwa biashara hii.",
      "Kila siku ni fursa ya kujifunza na kukua.",
      "Ukarimu wako unaweza kuwa tofauti kwa mtu.",
      "Leo fanya kazi kama kila mtu anakutegemea wewe.",
      "Kila mteja ana hadithi yake - sikiliza.",
      "Wewe ni muhimu kwa timu na wateja.",
      "Leo ni siku ya kujenga uhusiano wa muda mrefu.",
      "Kumbuka: wateja wako wanategemea wewe.",
      "Kila siku ni fursa ya kufanya tofauti.",
      "Uwezo wako wa kusaidia unaweza kubadilisha maisha.",
      "Leo fanya kazi kama kila mteja ni muhimu.",
      "Kumbuka: wewe ni sehemu muhimu ya timu.",
      "Kila simu, kila ujumbe - unaweza kubadilisha siku.",
      "Wateja wako wanategemea uwezo wako wa kusaidia.",
      "Leo ni siku ya kujenga ujasiri wa wateja.",
      "Kumbuka: wewe ni muhimu kwa biashara hii.",
      "Kila siku ni fursa ya kujifunza na kukua.",
      "Ukarimu wako unaweza kuwa tofauti kwa mtu.",
      "Leo fanya kazi kama mtu anategemea wewe.",
      // Zilizoongezwa mpya
      "Kumbuka: mchango wako ni wa kipekee na hauwezi kubadilishwa.",
      "Kila tabasamu lako linaongeza thamani kwa biashara hii.",
      "Wewe ni nguzo muhimu ya mafanikio yetu.",
      "Kila hatua yako inasaidia biashara kusonga mbele.",
      "Kumbuka: bila wewe, huduma zetu hazingekuwa bora.",
      "Uaminifu wako ni msingi wa mafanikio ya timu.",
      "Kila siku unaleta tofauti kubwa kwa wateja wetu.",
      "Jitihada zako zinaonekana na zinathaminiwa.",
      "Kila changamoto ni fursa ya kuonyesha ubora wako.",
      "Kumbuka: wewe ni mfano wa kuigwa kwa wengine.",
      "Huduma yako bora inajenga jina la biashara yetu.",
      "Kila mteja anayefurahi ni ushindi wako pia.",
      "Kumbuka: mafanikio ya biashara ni matokeo ya kazi yako nzuri.",
      "Wewe ni sehemu ya mafanikio ya kila siku.",
      "Kila siku ni nafasi mpya ya kung'ara na kuleta mabadiliko."
    ];
    
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return motivations[dayOfYear % motivations.length];
  };

  // Modal functions
  const openReadyHandoverModal = () => setShowReadyHandoverModal(true);
  const closeReadyHandoverModal = () => setShowReadyHandoverModal(false);
  
  const openOverdueModal = () => setShowOverdueModal(true);
  const closeOverdueModal = () => setShowOverdueModal(false);
  
  const openReturnedCCModal = () => setShowReturnedCCModal(true);
  const closeReturnedCCModal = () => setShowReturnedCCModal(false);
  
  const openCompletedTodayModal = () => setShowCompletedTodayModal(true);
  const closeCompletedTodayModal = () => setShowCompletedTodayModal(false);
  
  const openTotalCustomersModal = () => setShowTotalCustomersModal(true);
  const closeTotalCustomersModal = () => setShowTotalCustomersModal(false);

  // Function to calculate overdue time
  const getOverdueTime = (device: Device) => {
    if (!device.expectedReturnDate) return 'No due date';
    
    const now = new Date();
    const dueDate = new Date(device.expectedReturnDate);
    const diffMs = now.getTime() - dueDate.getTime();
    
    if (diffMs <= 0) return 'Not overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
      return `${diffDays}d ${remainingHours}h overdue`;
    } else {
      return `${diffHours}h overdue`;
    }
  };

  // Filter devices for customer care focus
  const readyForHandover = devices.filter(d => d.status === 'repair-complete');
  const returnedToCC = devices.filter(d => d.status === 'returned-to-customer-care');
  const done = devices.filter(d => d.status === 'done');
  const overdueHandovers = getOverdueDevices().filter(d => 
    ['repair-complete', 'returned-to-customer-care'].includes(d.status)
  );

  // Debug: Log device counts to console
  console.log('Dashboard Data:', {
    totalDevices: devices.length,
    readyForHandover: readyForHandover.length,
    returnedToCC: returnedToCC.length,
    done: done.length,
    overdueHandovers: overdueHandovers.length,
    deviceStatuses: devices.map(d => ({ id: d.id, status: d.status, customerName: d.customerName }))
  });

  // Apply search and status filters
  const filteredDevices = useMemo(() => {
    let filtered = devices.filter(device => device.status !== 'done'); // Exclude done devices from main list
    
    if (searchQuery) {
      filtered = filtered.filter(device => 
        device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.phoneNumber && device.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.remarks && device.remarks.some(r => r.content && r.content.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    
    return filtered;
  }, [devices, searchQuery, statusFilter]);

  // Count devices by status
  const countByStatus = (status: DeviceStatus) => {
    return filteredDevices.filter(d => d.status === status).length;
  };

  const priorityCards = [
    {
      label: 'Ready for Handover',
      count: readyForHandover.length,
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />,
      color: 'from-emerald-500/20 to-emerald-400/10',
      priority: 'high'
    },
    {
      label: 'Overdue Handovers',
      count: overdueHandovers.length,
      subtitle: overdueHandovers.length > 0 ? 
        `${overdueHandovers.reduce((total, device) => {
          const now = new Date();
          const dueDate = new Date(device.expectedReturnDate || '');
          const diffMs = now.getTime() - dueDate.getTime();
          return total + Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        }, 0)}h total` : '',
      icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />,
      color: 'from-red-500/20 to-red-400/10',
      priority: 'high'
    },
    {
      label: 'Returned to CC',
      count: returnedToCC.length,
      icon: <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-teal-500" />,
      color: 'from-teal-500/20 to-cyan-400/10',
      priority: 'medium'
    },
    {
      label: 'Completed Today',
      count: done.filter(d => {
        const today = new Date().toDateString();
        const doneDate = new Date(d.updatedAt || '').toDateString();
        return doneDate === today;
      }).length,
      icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />,
      color: 'from-gray-500/20 to-gray-400/10',
      priority: 'low'
    }
  ];

  // Show notifications for priority items
  useEffect(() => {
    if (overdueHandovers.length > 0) {
      toast.error(`You have ${overdueHandovers.length} overdue handover${overdueHandovers.length > 1 ? 's' : ''}! Please contact customers.`, { 
        id: 'cc-overdue-reminder',
        duration: 6000
      });
    } else if (readyForHandover.length > 0) {
      toast(`You have ${readyForHandover.length} device${readyForHandover.length > 1 ? 's' : ''} ready for handover.`, { 
        id: 'cc-handover-reminder',
        duration: 4000
      });
    }
  }, [overdueHandovers.length, readyForHandover.length]);

  // --- Motivational Greeting & Quote ---
  const userName = currentUser?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const motivationalQuotes = [
    'Every new customer is a new opportunity!',
    'You’re just one step away from your goal!',
    'Great service brings great rewards!',
    'Keep up the amazing work!',
    'Your effort makes a difference every day!'
  ];
  const quote = motivationalQuotes[(new Date().getDate()) % motivationalQuotes.length];

  // --- Streak Calculation (simple local streak for demo) ---
  const streak = Number(localStorage.getItem('customer_goal_streak') || 0);
  useEffect(() => {
    if (progress >= 100) {
      const lastStreakDate = localStorage.getItem('customer_goal_streak_date');
      const today = new Date().toISOString().slice(0, 10);
      if (lastStreakDate !== today) {
        localStorage.setItem('customer_goal_streak', String(streak + 1));
        localStorage.setItem('customer_goal_streak_date', today);
      }
    }
  }, [progress]);

  // --- Progress Message ---
  let progressMsg = '';
  if (progress >= 100) progressMsg = 'Congratulations! You’ve reached your daily goal!';
  else if (progress >= 80) progressMsg = `Almost there! Just ${Math.max(1, dailyGoal - newCustomersToday.length)} more to reach your goal!`;
  else if (newCustomersToday.length === 0) progressMsg = 'Let’s get started! Register your first customer today.';
  else progressMsg = 'Great job! Keep up the momentum!';

  // --- Customer Insights Data ---
  // Frequent Visitors (top 5 by check-ins this month)
  const monthStr = new Date().toISOString().slice(0, 7);
  const checkinCounts: Record<string, number> = {};
  (customers || []).forEach((c: any) => {
    if (c.joinedDate && c.joinedDate.slice(0, 7) === monthStr) {
      checkinCounts[c.id] = (checkinCounts[c.id] || 0) + 1;
    }
  });
  const frequentVisitors = Object.entries(checkinCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cid, count]) => {
      const c = customers.find((cu: any) => cu.id === cid);
      return c ? { ...c, count } : null;
    })
    .filter(Boolean);

  // Birthdays This Month
  const thisMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const birthdaysThisMonth = (customers || []).filter((c: any) => c.birthMonth === thisMonth);

  // Customers With No Recent Visit (60+ days)
  const now = Date.now();
  const inactiveCustomers = (customers || []).filter((c: any) => {
    const last = new Date(c.lastVisit).getTime();
    return now - last > 60 * 24 * 60 * 60 * 1000;
  });

  // Build improved suggestions for SearchBar
  const searchSuggestions = useMemo(() => {
    const deviceSuggestions = devices.flatMap(d => [d.id, d.customerName, d.phoneNumber, d.brand, d.model, d.serialNumber])
      .filter(Boolean);
    // Remove duplicates and empty values
    return Array.from(new Set(deviceSuggestions)).filter(s => !!s && typeof s === 'string');
  }, [devices]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Motivational Greeting & Quote */}
      <div className="mb-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            {greeting}, {userName}!
            {streak > 1 && <span className="ml-2 flex items-center gap-1 text-yellow-500 text-lg font-bold animate-glow"><Star size={20} /> {streak} day streak!</span>}
          </h2>
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              window.location.reload();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <div className="text-blue-700 font-semibold text-lg mb-1">{quote}</div>
      </div>

      {/* Staff Points Card */}
      <div
        className={`mb-4 flex flex-col gap-0 justify-between py-4 px-6 bg-white/90 rounded-xl transition-all duration-300 cursor-pointer ${expanded ? 'shadow-2xl scale-[1.03]' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-5">
          {/* Left: Trophy Icon in circle */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
              <Trophy size={28} className="text-yellow-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{currentUser?.points ?? 0}</span>
              <span className="text-2xl font-bold text-gray-700">Daily points</span>
            </div>
          </div>
          {/* Right: Progress Icons Only */}
          <div className="flex gap-4 items-center text-base font-bold">
            <span className="flex items-center gap-1 text-yellow-600"><UserCheck size={20} />{Object.keys(checkinStats).length}</span>
            <span className="flex items-center gap-1 text-blue-600"><Users size={20} />{newCustomersToday.length}</span>
            <span className="flex items-center gap-1 text-green-600"><ClipboardList size={20} />{devicesToday.length}</span>
            <span className="flex items-center gap-1 text-pink-600"><Gift size={20} />{birthdaysThisMonth.length}</span>
          </div>
        </div>
        {/* Expandable details */}
        <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[400px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Checked In Today */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-yellow-100">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-2"><UserCheck size={28} className="text-yellow-500" /></span>
              <span className="text-3xl font-extrabold text-gray-900 mb-1">{Object.keys(checkinStats).length}</span>
              <span className="text-xs font-semibold text-gray-500 mb-2">Checked In</span>
              <div className="w-full h-1 bg-yellow-100 rounded-full overflow-hidden">
                <div className="h-1 bg-yellow-400 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((Object.keys(checkinStats).length / 5) * 100))}%` }} />
              </div>
            </div>
            {/* New Customers Today */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-blue-100">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2"><Users size={28} className="text-blue-500" /></span>
              <span className="text-3xl font-extrabold text-gray-900 mb-1">{newCustomersToday.length}</span>
              <span className="text-xs font-semibold text-gray-500 mb-2">New Customers</span>
              <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-1 bg-blue-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((newCustomersToday.length / 5) * 100))}%` }} />
              </div>
            </div>
            {/* Devices Received Today */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-green-100">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2"><ClipboardList size={28} className="text-green-500" /></span>
              <span className="text-3xl font-extrabold text-gray-900 mb-1">{devicesToday.length}</span>
              <span className="text-xs font-semibold text-gray-500 mb-2">Devices Received</span>
              <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden">
                <div className="h-1 bg-green-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((devicesToday.length / 5) * 100))}%` }} />
              </div>
            </div>
            {/* Birthdays This Month */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-pink-100">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 mb-2"><Gift size={28} className="text-pink-500" /></span>
              <span className="text-3xl font-extrabold text-gray-900 mb-1">{birthdaysThisMonth.length}</span>
              <span className="text-xs font-semibold text-gray-500 mb-2">Birthdays</span>
              <div className="w-full h-1 bg-pink-100 rounded-full overflow-hidden">
                <div className="h-1 bg-pink-500 rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min(100, Math.round((birthdaysThisMonth.length / 10) * 100))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- TOP: Dashboard Stats Grid --- */}
      {/* Removed the dashboard stats grid with three GlassCard widgets for New Customers Today, My Activities Today, and Customers Checked In Today. */}
      {/* --- Customer Insights Section --- */}
      {/* Removed the customer insights section grid with three GlassCard widgets for Frequent Visitors, Birthdays This Month, and No Recent Visit (60+ days). */}
      {/* Section Divider */}
      <div className="border-b border-gray-200 mb-4" />

      {/* Priority Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        {priorityCards.map((card, index) => (
          <GlassCard 
            key={index} 
            className={`bg-gradient-to-br ${card.color} cursor-pointer hover:scale-105 transition-transform duration-200 p-4 sm:p-6 col-span-1 h-full`}
            onClick={() => {
              if (index === 0) openReadyHandoverModal();
              else if (index === 1) openOverdueModal();
              else if (index === 2) openReturnedCCModal();
              else if (index === 3) openCompletedTodayModal();
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.label}</p>
                <p className="text-2xl sm:text-4xl font-bold text-gray-900">{card.count}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className="flex-shrink-0 ml-2">
                {card.icon}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="flex flex-wrap justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Link
          to="/devices/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-500/70 hover:bg-blue-600/70 text-white py-3 px-4 sm:py-2 sm:px-6 rounded-lg border border-blue-300/30 backdrop-blur-md transition-colors duration-150 text-sm flex-1 sm:flex-none min-w-[120px]"
        >
          <PlusCircle size={16} />
          <span className="hidden sm:inline">New Device</span>
          <span className="sm:hidden">New</span>
        </Link>
        <button
          onClick={() => setShowScanner(true)}
          className="inline-flex items-center justify-center gap-2 bg-purple-500/70 hover:bg-purple-600/70 text-white py-3 px-4 sm:py-2 sm:px-6 rounded-lg border border-purple-300/30 backdrop-blur-md transition-colors duration-150 text-sm flex-1 sm:flex-none min-w-[120px]"
        >
          <QrCode size={16} />
          <span className="hidden sm:inline">Scan Device</span>
          <span className="sm:hidden">Scan</span>
        </button>
        <Link
          to="/customers"
          className="inline-flex items-center justify-center gap-2 bg-green-500/70 hover:bg-green-600/70 text-white py-3 px-4 sm:py-2 sm:px-6 rounded-lg border border-green-300/30 backdrop-blur-md transition-colors duration-150 text-sm flex-1 sm:flex-none min-w-[120px]"
        >
          <Users size={16} />
          <span className="hidden sm:inline">Manage Customers</span>
          <span className="sm:hidden">Customers</span>
        </Link>
        <Link
          to="/sms"
          className="inline-flex items-center justify-center gap-2 bg-orange-500/70 hover:bg-orange-600/70 text-white py-3 px-4 sm:py-2 sm:px-6 rounded-lg border border-orange-300/30 backdrop-blur-md transition-colors duration-150 text-sm flex-1 sm:flex-none min-w-[120px]"
        >
          <MessageSquare size={16} />
          <span className="hidden sm:inline">SMS Center</span>
          <span className="sm:hidden">SMS</span>
        </Link>
      </div>

      {/* Filter Chips */}
      {(searchQuery || statusFilter !== 'all') && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {searchQuery && (
            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Search: {searchQuery}
              <button
                type="button"
                className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                &#10005;
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Status: {statusFilter}
              <button
                type="button"
                className="ml-2 text-green-500 hover:text-green-700 focus:outline-none"
                onClick={() => setStatusFilter('all')}
                aria-label="Clear status filter"
              >
                &#10005;
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search and Filter - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search devices..."
            className="flex-1"
            suggestions={[]}
            searchKey="customer_care_devices"
          />
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'customer' | 'brand' | 'status')}
                className="
                  py-2 sm:py-3 pl-10 sm:pl-12 pr-10 
                  bg-white/20 backdrop-blur-md
                  border border-white/30 rounded-lg
                  text-gray-800 text-sm sm:text-base
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  transition-all duration-300
                  appearance-none
                "
              >
                <option value="date">Sort by Date</option>
                <option value="customer">Sort by Customer</option>
                <option value="brand">Sort by Device</option>
                <option value="status">Sort by Status</option>
              </select>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <ArrowUpDown size={18} className="sm:w-5 sm:h-5" />
              </span>
            </div>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="
                p-2 sm:p-3
                bg-white/20 backdrop-blur-md
                border border-white/30 rounded-lg
                text-gray-800 hover:bg-white/30
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                transition-all duration-300
              "
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp size={18} className="sm:w-5 sm:h-5" />
              ) : (
                <ArrowDown size={18} className="sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 justify-start w-fit mx-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors whitespace-nowrap text-sm ${
              statusFilter === 'all'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Device List - Mobile Optimized */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading devices...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No devices found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {sortDevices(filteredDevices)
              .map((device, index) => (
                <DeviceCard key={`${device.id}-${index}`} device={device} />
              ))}
          </div>
        )}
      </div>

      {/* All Done Status Devices Section */}
      {done.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-400/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{done.length}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Completed Devices</h3>
                <p className="text-sm text-gray-600">Successfully completed work</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortDevices(removeDuplicateDevices(done))
              .slice(0, showAllDevices ? done.length : 6) // Show all or first 6
              .map((device, index) => (
                <GlassCard 
                  key={device.id} 
                  className={`transform transition-all duration-500 ease-in-out hover:translate-y-[-5px] hover:scale-105 ${
                    selectedDevice?.id === device.id 
                      ? 'border-green-400 bg-green-50 shadow-lg shadow-green-500/20 scale-105 ring-2 ring-green-200' 
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedDevice(device);
                    setShowDeviceDetailModal(true);
                  }}
                >
                  {/* Header with Status Badge */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 w-full">
                      <h3 className="font-bold text-base text-gray-900 truncate">
                        {device.brand} {device.model}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200">
                      <Check size={16} className="text-green-600 font-bold" />
                      Done
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <UserCheck size={16} className="text-blue-500" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${device.customerId}`);
                        }}
                        className="text-base font-semibold truncate text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {device.customerName}
                      </button>
                    </div>

                    {/* Completion Date */}
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-white/20 backdrop-blur-md shadow mt-1">
                      <CheckCircle className="text-purple-600 drop-shadow" size={16} />
                      <span className="font-semibold text-sm sm:text-base text-purple-900">Completed:</span>
                      <span className="ml-1 font-semibold text-sm sm:text-base text-purple-700">
                        {new Date(device.updatedAt || '').toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Phone Number */}
                    {device.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={14} className="text-gray-500" />
                        <span className="text-xs truncate">{device.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
          </div>
          
          {done.length > 6 && (
            <div className="mt-6 text-center">
              <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
                {!showAllDevices ? (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      +{done.length - 6} more completed devices
                    </span>
                    <button 
                      onClick={() => setShowAllDevices(true)}
                      className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
                    >
                      View All
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      Showing all {done.length} devices
                    </span>
                    <button 
                      onClick={() => setShowAllDevices(false)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Show Less
                    </button>
                  </>
                )}
              </GlassCard>
            </div>
          )}
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner onClose={() => setShowScanner(false)} />
      )}

      {/* Ready for Handover Modal */}
      {showReadyHandoverModal && (
        <Modal isOpen={showReadyHandoverModal} onClose={closeReadyHandoverModal} title="Ready for Handover">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Devices ready to be handed over to customers:</p>
            {readyForHandover.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No devices ready for handover</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {readyForHandover.map((device) => (
                  <div key={device.id} className="p-3 bg-gray-50 rounded-lg border relative">
                    <div className="flex justify-between items-start pt-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{device.brand} {device.model}</p>
                        <p className="text-sm text-gray-600 truncate">Customer: <span className="capitalize">{device.customerName}</span></p>
                        <p className="text-xs text-gray-500">ID: {device.id}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <StatusBadge status={device.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Overdue Handovers Modal */}
      {showOverdueModal && (
        <Modal isOpen={showOverdueModal} onClose={closeOverdueModal} title="Overdue Handovers">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Devices overdue for handover:</p>
            {overdueHandovers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No overdue handovers</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overdueHandovers.map((device) => (
                  <div key={device.id} className="p-3 bg-red-50 rounded-lg border border-red-200 relative">
                    <div className="flex justify-between items-start pt-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{device.brand} {device.model}</p>
                        <p className="text-sm text-gray-600 truncate">Customer: <span className="capitalize">{device.customerName}</span></p>
                        <p className="text-xs text-red-600 font-semibold">{getOverdueTime(device)}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <StatusBadge status={device.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Returned to CC Modal */}
      {showReturnedCCModal && (
        <Modal isOpen={showReturnedCCModal} onClose={closeReturnedCCModal} title="Returned to Customer Care">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Devices returned to customer care:</p>
            {returnedToCC.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No devices returned to CC</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {returnedToCC.map((device) => (
                  <div key={device.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200 relative">
                    <div className="flex justify-between items-start pt-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{device.brand} {device.model}</p>
                        <p className="text-sm text-gray-600 truncate">Customer: <span className="capitalize">{device.customerName}</span></p>
                        <p className="text-xs text-gray-500">ID: {device.id}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <StatusBadge status={device.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Completed Today Modal */}
      {showCompletedTodayModal && (
        <Modal isOpen={showCompletedTodayModal} onClose={closeCompletedTodayModal} title="Completed Today">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Devices completed today:</p>
            {done.filter(d => {
              const today = new Date().toDateString();
              const doneDate = new Date(d.updatedAt || '').toDateString();
              return doneDate === today;
            }).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No devices completed today</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {done.filter(d => {
                  const today = new Date().toDateString();
                  const doneDate = new Date(d.updatedAt || '').toDateString();
                  return doneDate === today;
                }).map((device) => (
                  <div key={device.id} className="p-3 bg-green-50 rounded-lg relative">
                    <div className="flex justify-between items-start pt-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{device.brand} {device.model}</p>
                        <p className="text-sm text-gray-600 truncate">Customer: {device.customerName}</p>
                        <p className="text-xs text-green-600">Completed: {new Date(device.updatedAt || '').toLocaleDateString()}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <StatusBadge status={device.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Total Customers Modal */}
      {showTotalCustomersModal && (
        <Modal isOpen={showTotalCustomersModal} onClose={closeTotalCustomersModal} title="Total Customers">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">All registered customers:</p>
            {(!customers || customers.length === 0) ? (
              <p className="text-gray-500 text-center py-4">No customers found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customers.map((customer) => (
                  <div key={customer.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                        <p className="text-sm text-gray-600 truncate">Phone: {customer.phone}</p>
                        {/* Email hidden for privacy */}
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        Joined: {new Date(customer.joinedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Device Detail Modal */}
      {showDeviceDetailModal && selectedDevice && (
        <Modal 
          isOpen={showDeviceDetailModal} 
          onClose={() => setShowDeviceDetailModal(false)} 
          title={`${selectedDevice.brand} ${selectedDevice.model} - Details`}
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Device Info Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedDevice.brand} {selectedDevice.model}</h3>
                  <p className="text-sm text-gray-600">Serial: {selectedDevice.serialNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Customer</p>
                  <p className="text-base text-gray-900">{selectedDevice.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedDevice.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Issue</p>
                  <p className="text-sm text-gray-900">{selectedDevice.issueDescription}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Created</p>
                  <p className="text-sm text-gray-900">{new Date(selectedDevice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Completed</p>
                  <p className="text-sm text-green-600 font-semibold">{new Date(selectedDevice.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Device Timeline
              </h4>
              <div className="space-y-3">
                {selectedDevice.transitions && selectedDevice.transitions.length > 0 ? (
                  selectedDevice.transitions.map((transition, index) => (
                    <div key={transition.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {transition.fromStatus} → {transition.toStatus}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(transition.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">By: {transition.performedBy}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No timeline data available</p>
                  </div>
                )}
              </div>
            </div>



            {/* Additional Details */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                Additional Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {selectedDevice.repairCost && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-sm font-medium text-orange-700 mb-1">Repair Cost</p>
                    <p className="text-lg font-bold text-orange-600">{selectedDevice.repairCost}</p>
                  </div>
                )}
                {selectedDevice.depositAmount && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-1">Deposit</p>
                    <p className="text-lg font-bold text-blue-600">{selectedDevice.depositAmount}</p>
                  </div>
                )}
                {selectedDevice.estimatedHours && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-1">Estimated Hours</p>
                    <p className="text-lg font-bold text-green-600">{selectedDevice.estimatedHours}h</p>
                  </div>
                )}
                {selectedDevice.expectedReturnDate && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-sm font-medium text-purple-700 mb-1">Expected Return</p>
                    <p className="text-lg font-bold text-purple-600">
                      {new Date(selectedDevice.expectedReturnDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
};

export default CustomerCareDashboard; 

// Helper function for highlighting
function highlightMatch(text: string, query: string) {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<span className="bg-yellow-200 text-black font-bold">{text.slice(idx, idx + query.length)}</span>{text.slice(idx + query.length)}</>;
}