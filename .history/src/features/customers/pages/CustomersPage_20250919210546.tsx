import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { Customer, LoyaltyLevel } from '../../../types';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import BackgroundSearchIndicator from '../../../features/shared/components/ui/BackgroundSearchIndicator';
import CustomerFilters from '../components/CustomerFilters';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Star, UserCheck, Tag, Download, MessageSquare, Trash2, Plus, Grid, List, Filter, SortAsc,
  AlertCircle, UserPlus, FileSpreadsheet, Users, DollarSign, Activity, MessageCircle, BarChart3, Award,
  Clock, Phone, Mail, Edit, Eye, CheckCircle, XCircle, BarChart2, Crown, Calendar, RotateCcw, RefreshCw,
  ChevronLeft, ChevronRight, Gift, CalendarDays, Clock3, UserPlus2, AlertTriangle, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BulkSMSModal from '../components/BulkSMSModal';
import ExcelImportModal from '../components/ExcelImportModal';
import CustomerUpdateImportModal from '../components/CustomerUpdateImportModal';
import CustomerDetailModal from '../components/CustomerDetailModal';
import DropdownPortal from '../../../features/shared/components/ui/DropdownPortal';
import { smsService } from '../../../services/smsService';
import { fetchAllCustomers, fetchCustomersPaginated, searchCustomers, searchCustomersFast, searchCustomersBackground, getBackgroundSearchManager, fetchAllAppointments } from '../../../lib/customerApi';
import { formatCurrency } from '../../../lib/customerApi';
import { fetchCustomerStats, CustomerStats } from '../../../lib/customerStatsApi';
import AddCustomerModal from '../components/forms/AddCustomerModal';
import { supabase } from '../../../lib/supabaseClient';
import useFinancialData from '../../../hooks/useFinancialData';
import BirthdayNotification from '../components/BirthdayNotification';
import BirthdayMessageSender from '../components/BirthdayMessageSender';
import BirthdayCalendar from '../components/BirthdayCalendar';
import BirthdayRewards from '../components/BirthdayRewards';

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
  const [searchParams] = useSearchParams();
  const { markCustomerAsRead } = useCustomers();
  const { summary, loading: financialLoading } = useFinancialData();
  // Restore preferences from localStorage
  const prefs = getInitialPrefs();
  const [searchQuery, setSearchQuery] = useState(prefs.searchQuery ?? '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(prefs.searchQuery ?? '');
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
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [sortBy, setSortBy] = useState(prefs.sortBy ?? 'name');
  const [pageLoading, setPageLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Background search state
  const [isBackgroundSearching, setIsBackgroundSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('pending');
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentSearchJobId, setCurrentSearchJobId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Add state for multi-select filters
  const [loyaltyFilterMulti, setLoyaltyFilterMulti] = useState<LoyaltyLevel[]>([]);
  const [statusFilterMulti, setStatusFilterMulti] = useState<Array<'active' | 'inactive'>>([]);
  const [tagFilterMulti, setTagFilterMulti] = useState<string[]>([]);
  const [referralFilterMulti, setReferralFilterMulti] = useState<string[]>([]);
  const [birthdayFilter, setBirthdayFilter] = useState(false);


  // Appointments state
  const [activeTab, setActiveTab] = useState<'customers' | 'appointments'>('customers');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentFilters, setAppointmentFilters] = useState({
    status: 'all',
    date: 'all',
    customer: 'all'
  });

  // Device statistics state
  const [totalDevices, setTotalDevices] = useState(0);
  const [devicesInRepair, setDevicesInRepair] = useState(0);

  // Database statistics state
  const [dbStats, setDbStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    todaysBirthdays: 0,
    totalRevenue: 0,
    totalDevices: 0
  });
  const [dbStatsLoading, setDbStatsLoading] = useState(true);

  // Birthday management state
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);
  const [showBirthdayMessageSender, setShowBirthdayMessageSender] = useState(false);
      const [showBirthdayCalendar, setShowBirthdayCalendar] = useState(false);
    const [showBirthdayRewards, setShowBirthdayRewards] = useState(false);
    const [showAllBirthdays, setShowAllBirthdays] = useState(false);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // Reduced to 300ms for better responsiveness

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        if (currentPage === 1) {
          setLoading(true);
        } else {
          setPageLoading(true);
        }
        
        // Set search loading state when searching (only if we have enough characters)
        if (debouncedSearchQuery.trim() && debouncedSearchQuery.trim().length >= 2) {
          setSearchLoading(true);
        } else {
          setSearchLoading(false);
        }
        
        // Cancel any existing background search
        if (currentSearchJobId) {
          const searchManager = getBackgroundSearchManager();
          searchManager.cancelSearchJob(currentSearchJobId);
        }
        
        if (debouncedSearchQuery.trim() && debouncedSearchQuery.trim().length >= 2) {
          // Use direct search for better performance and typing experience
          const result = await searchCustomers(debouncedSearchQuery, currentPage, 50);
          setCustomers(result.customers);
          setTotalCount(result.total);
          setTotalPages(result.totalPages);
          setHasNextPage(currentPage < result.totalPages);
          setHasPreviousPage(currentPage > 1);
          setIsBackgroundSearching(false);
          setSearchStatus('completed');
          setSearchProgress(100);
          setCurrentSearchJobId(null);
        } else {
          // Use regular pagination when no search query
          const result = await fetchCustomersPaginated(currentPage, 50);
          setCustomers(result.customers);
          setTotalCount(result.totalCount);
          setTotalPages(result.totalPages);
          setHasNextPage(result.hasNextPage);
          setHasPreviousPage(result.hasPreviousPage);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customers');
      } finally {
        setLoading(false);
        setPageLoading(false);
        setSearchLoading(false);
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
  }, [currentPage, debouncedSearchQuery]);

  // Reset modal states on component mount
  useEffect(() => {
    setShowCustomerUpdateImport(false);
    setShowExcelImport(false);
    setShowAddCustomerModal(false);
    setShowBulkSMS(false);
  }, []);

  // Fetch real appointments data
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const appointmentsData = await fetchAllAppointments();
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        // Fallback to empty array if fetch fails
        setAppointments([]);
      }
    };
    
    fetchAppointments();
  }, []);

  // Fetch total devices count from devices table
  useEffect(() => {
    const fetchDeviceStats = async () => {
      try {
        // Get total devices count
        const { count: totalCount, error: totalError } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true });

        if (totalError) {
          console.error('Error fetching total devices count:', totalError);
        } else {
          setTotalDevices(totalCount || 0);
        }

        // Get devices in repair count
        const { count: repairCount, error: repairError } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .in('status', ['in-repair', 'diagnosis-started']);

        if (repairError) {
          console.error('Error fetching devices in repair count:', repairError);
        } else {
          setDevicesInRepair(repairCount || 0);
        }
      } catch (error) {
        console.error('Error fetching device statistics:', error);
      }
    };

    fetchDeviceStats();
  }, []);

  // Fetch database statistics
  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        setDbStatsLoading(true);
        const stats = await fetchCustomerStats();
        setDbStats(stats);
      } catch (error) {
        console.error('Error fetching database statistics:', error);
      } finally {
        setDbStatsLoading(false);
      }
    };

    fetchDatabaseStats();
  }, []);

  // Calculate statistics from current page data and financial data
  const stats = useMemo(() => {
    // Ensure customers is an array to prevent undefined errors
    if (!customers || !Array.isArray(customers)) {
      return {
        totalCustomers: dbStats.totalCustomers,
        pageCustomers: 0,
        activeCustomers: dbStats.activeCustomers,
        vipCustomers: 0,
        totalRevenue: dbStats.totalRevenue,
        deviceRevenue: 0,
        posRevenue: 0,
        totalPoints: 0,
        platinumCustomers: 0,
        goldCustomers: 0,
        silverCustomers: 0,
        bronzeCustomers: 0,
        totalDevices: dbStats.totalDevices,
        devicesInRepair,
        todaysBirthdays: dbStats.todaysBirthdays
      };
    }
    
    const pageCustomers = customers.length;
    const vipCustomers = customers.filter(c => c.colorTag === 'vip').length;
    
    // For now, set device and POS revenue to 0 - this should be fetched separately
    const deviceRevenue = 0;
    const posRevenue = 0;
    
    const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
    const platinumCustomers = customers.filter(c => c.loyaltyLevel === 'platinum').length;
    const goldCustomers = customers.filter(c => c.loyaltyLevel === 'gold').length;
    const silverCustomers = customers.filter(c => c.loyaltyLevel === 'silver').length;
    const bronzeCustomers = customers.filter(c => c.loyaltyLevel === 'bronze').length;

    return {
      totalCustomers: dbStats.totalCustomers, // Use database stats
      pageCustomers, // Customers on current page
      activeCustomers: dbStats.activeCustomers, // Use database stats
      vipCustomers,
      totalRevenue: dbStats.totalRevenue, // Use database stats
      deviceRevenue,
      posRevenue,
      totalPoints,
      platinumCustomers,
      goldCustomers,
      silverCustomers,
      bronzeCustomers,
      totalDevices: dbStats.totalDevices, // Use database stats
      devicesInRepair,
      todaysBirthdays: dbStats.todaysBirthdays // Use database stats
    };
  }, [customers, dbStats, devicesInRepair]);

  // Calculate appointments statistics
  const appointmentStats = useMemo(() => {
    // Ensure appointments is an array to prevent undefined errors
    if (!appointments || !Array.isArray(appointments)) {
      return {
        totalAppointments: 0,
        confirmedAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        todaysAppointments: 0,
        thisWeeksAppointments: 0
      };
    }
    
    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    
    // Today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(a => a.appointment_date === today).length;
    
    // This week's appointments
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
    
    const thisWeeksAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointment_date);
      return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
    }).length;

          return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        todaysAppointments,
        thisWeeksAppointments
      };
    }, [appointments]);

  // Calculate today's birthdays and upcoming birthdays
  const todaysBirthdays = useMemo(() => {
    // For now, return empty array since we're using database stats
    // The actual birthday customers list would need to be fetched separately if needed
    return [];
  }, []);

  // Calculate upcoming birthdays (next 7 days)
  const upcomingBirthdays = useMemo(() => {
    if (!customers || !Array.isArray(customers)) {
      return [];
    }
    
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return customers.filter(customer => {
      if (!customer.birthMonth || !customer.birthDay) return false;
      
      let customerMonth: number;
      let customerDay: number;
      
      // Handle different month formats
      if (typeof customer.birthMonth === 'string') {
        if (customer.birthMonth.trim() === '') return false;
        
        // Check if it's a numeric month (1-12)
        const numericMonth = parseInt(customer.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          customerMonth = numericMonth;
        } else {
          // Convert month name to number
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          customerMonth = monthNames.indexOf(customer.birthMonth.toLowerCase()) + 1;
        }
      } else {
        return false;
      }
      
      // Handle different day formats
      if (typeof customer.birthDay === 'string') {
        if (customer.birthDay.trim() === '') return false;
        
        // Extract day from formats like "14 00:00:00" or "14"
        const dayMatch = customer.birthDay.match(/^(\d+)/);
        if (dayMatch) {
          customerDay = parseInt(dayMatch[1]);
        } else {
          customerDay = parseInt(customer.birthDay);
        }
      } else {
        customerDay = parseInt(customer.birthDay);
      }
      
      // Create birthday date for this year
      const birthdayThisYear = new Date(today.getFullYear(), customerMonth - 1, customerDay);
      
      // If birthday has passed this year, check next year
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
      }
      
      return birthdayThisYear >= today && birthdayThisYear <= nextWeek;
    }).sort((a, b) => {
      // Sort by upcoming birthday date
      let aMonth: number, bMonth: number, aDay: number, bDay: number;
      
      // Parse month and day for customer a
      if (typeof a.birthMonth === 'string' && a.birthMonth.trim() !== '') {
        const numericMonth = parseInt(a.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          aMonth = numericMonth;
        } else {
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          aMonth = monthNames.indexOf(a.birthMonth.toLowerCase()) + 1;
        }
      } else {
        aMonth = 1;
      }
      
      if (typeof a.birthDay === 'string' && a.birthDay.trim() !== '') {
        const dayMatch = a.birthDay.match(/^(\d+)/);
        aDay = dayMatch ? parseInt(dayMatch[1]) : parseInt(a.birthDay);
      } else {
        aDay = 1;
      }
      
      // Parse month and day for customer b
      if (typeof b.birthMonth === 'string' && b.birthMonth.trim() !== '') {
        const numericMonth = parseInt(b.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          bMonth = numericMonth;
        } else {
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          bMonth = monthNames.indexOf(b.birthMonth.toLowerCase()) + 1;
        }
      } else {
        bMonth = 1;
      }
      
      if (typeof b.birthDay === 'string' && b.birthDay.trim() !== '') {
        const dayMatch = b.birthDay.match(/^(\d+)/);
        bDay = dayMatch ? parseInt(dayMatch[1]) : parseInt(b.birthDay);
      } else {
        bDay = 1;
      }
      
      const aDate = new Date(today.getFullYear(), aMonth - 1, aDay);
      const bDate = new Date(today.getFullYear(), bMonth - 1, bDay);
      
      if (aDate < today) aDate.setFullYear(today.getFullYear() + 1);
      if (bDate < today) bDate.setFullYear(today.getFullYear() + 1);
      
      return aDate.getTime() - bDate.getTime();
    });
  }, [customers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, loyaltyFilterMulti, statusFilterMulti, tagFilterMulti, referralFilterMulti, birthdayFilter, showInactive, sortBy]);

  // Handle customerId parameter from URL
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setShowCustomerDetailModal(true);
        markCustomerAsRead(customerId);
        // Clean up the URL parameter
        navigate('/customers', { replace: true });
      }
    }
  }, [searchParams, customers, markCustomerAsRead, navigate]);

  // Clean filter implementation - now works with server-side search
  const filteredCustomers = useMemo(() => {
    // Ensure customers is an array to prevent undefined errors
    if (!customers || !Array.isArray(customers)) {
      return [];
    }
    
    let filtered = customers;

    // Note: Search is now handled server-side when searchQuery is provided
    // This client-side filtering is only for additional filters

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
  }, [
    customers, 
    debouncedSearchQuery, 
    loyaltyFilterMulti, 
    statusFilterMulti, 
    tagFilterMulti, 
    referralFilterMulti, 
    birthdayFilter, 
 
    showInactive, 
    sortBy
  ]);

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
      const result = await smsService.sendBulkSMS({
        recipients: recipients.map(c => c.phone),
        message: message,
        created_by: currentUser.id
      });

      if (result.success) {
        toast.success(`SMS sent successfully to all ${result.sent} customers!`);
      } else if (result.sent > 0) {
        toast.success(`SMS sent to ${result.sent} customers, ${result.failed} failed.`);
      } else {
        toast.error(`Failed to send SMS to any customers. ${result.failed} errors.`);
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

  // Helper: get purchase summary for a customer
  const getCustomerPurchaseSummary = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.payments) return { totalPurchases: 0, totalItems: 0, lastPurchase: null };
    
    // Only device payments now
    const devicePayments = customer.payments.filter(p => p.source === 'device_payment' && p.status === 'completed');
    const totalPurchases = devicePayments.length;
    const totalItems = totalPurchases; // Each payment represents one device
    
    let lastPurchase = null;
    if (devicePayments.length > 0) {
      const latestPayment = devicePayments.reduce((latest, payment) => {
        const paymentDate = new Date(payment.date);
        const latestDate = new Date(latest.date);
        return paymentDate > latestDate ? payment : latest;
      }, devicePayments[0]);
      lastPurchase = latestPayment;
    }
    
    return { totalPurchases, totalItems, lastPurchase };
  };

  // Appointments helper functions
  const getAppointmentStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAppointments = useMemo(() => {
    // Ensure appointments is an array to prevent undefined errors
    if (!appointments || !Array.isArray(appointments)) {
      return [];
    }
    
    let filtered = appointments;

    // Status filter
    if (appointmentFilters.status !== 'all') {
      filtered = filtered.filter(a => a.status === appointmentFilters.status);
    }

    // Date filter
    if (appointmentFilters.date !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      switch (appointmentFilters.date) {
        case 'today':
          filtered = filtered.filter(a => a.appointment_date === today);
          break;
        case 'tomorrow':
          filtered = filtered.filter(a => a.appointment_date === tomorrow);
          break;
        case 'this-week':
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const endOfWeek = new Date();
          endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
          
          filtered = filtered.filter(a => {
            const appointmentDate = new Date(a.appointment_date);
            return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
          });
          break;
      }
    }

    // Customer filter
    if (appointmentFilters.customer !== 'all') {
      filtered = filtered.filter(a => a.customer_id === appointmentFilters.customer);
    }

    return filtered;
  }, [appointments, appointmentFilters]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3 opacity-60"></div>
            <p className="text-gray-500 text-sm">Loading customers...</p>
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
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">Manage your customer relationships, track loyalty, and schedule appointments</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {activeTab === 'customers' ? (
            <>
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
            </>
          ) : (
            <>
              <GlassButton
                onClick={() => {/* TODO: Add new appointment modal */}}
                icon={<UserPlus2 size={18} />}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                New Appointment
              </GlassButton>
              <GlassButton
                onClick={() => {/* TODO: Add calendar view */}}
                icon={<CalendarDays size={18} />}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
              >
                Calendar View
              </GlassButton>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'customers'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users size={18} />
          Customers ({stats.totalCustomers})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'appointments'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <CalendarDays size={18} />
          Appointments ({appointmentStats.totalAppointments})
        </button>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'customers' ? (
        <>
          {/* Statistics Dashboard Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Customer Statistics</h2>
            <button
              onClick={async () => {
                try {
                  setDbStatsLoading(true);
                  const stats = await fetchCustomerStats();
                  setDbStats(stats);
                } catch (error) {
                  console.error('Error refreshing statistics:', error);
                  toast.error('Failed to refresh statistics');
                } finally {
                  setDbStatsLoading(false);
                }
              }}
              disabled={dbStatsLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${dbStatsLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </button>
          </div>
          
          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Customers</p>
                  {dbStatsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-2xl font-bold text-blue-900">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-blue-900">{stats.totalCustomers}</p>
                  )}
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
                  {dbStatsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <p className="text-2xl font-bold text-green-900">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-green-900">{stats.activeCustomers}</p>
                  )}
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
                  {dbStatsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <p className="text-2xl font-bold text-purple-900">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalRevenue)}</p>
                  )}
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
                  {dbStatsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                      <p className="text-2xl font-bold text-amber-900">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-amber-900">{stats.totalDevices}</p>
                  )}
                </div>
                <div className="p-3 bg-amber-50/20 rounded-full">
                  <Activity className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </GlassCard>

            <GlassCard 
              className="bg-gradient-to-br from-pink-50 to-pink-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              onClick={() => setShowAllBirthdays(true)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600">Today's Birthdays</p>
                  {dbStatsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                      <p className="text-2xl font-bold text-pink-900">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-pink-900">{stats.todaysBirthdays}</p>
                  )}
                </div>
                <div className="p-3 bg-pink-50/20 rounded-full">
                  <Gift className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      ) : (
        <>
          {/* Appointments Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-blue-900">{appointmentStats.totalAppointments}</p>
                </div>
                <div className="p-3 bg-blue-50/20 rounded-full">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-900">{appointmentStats.confirmedAppointments}</p>
                </div>
                <div className="p-3 bg-green-50/20 rounded-full">
                                          <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{appointmentStats.pendingAppointments}</p>
                </div>
                <div className="p-3 bg-yellow-50/20 rounded-full">
                  <Clock3 className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Today's</p>
                  <p className="text-2xl font-bold text-purple-900">{appointmentStats.todaysAppointments}</p>
                </div>
                <div className="p-3 bg-purple-50/20 rounded-full">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-pink-50 to-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600">Birthdays</p>
                  <p className="text-2xl font-bold text-pink-900">{todaysBirthdays.length}</p>
                </div>
                <div className="p-3 bg-pink-50/20 rounded-full">
                  <Gift className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Appointments Filters */}
          <GlassCard className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={appointmentFilters.status}
                  onChange={(e) => setAppointmentFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <select
                  value={appointmentFilters.date}
                  onChange={(e) => setAppointmentFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this-week">This Week</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <select
                  value={appointmentFilters.customer}
                  onChange={(e) => setAppointmentFilters(prev => ({ ...prev, customer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Customers</option>
                  {customers.slice(0, 10).map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Appointments List */}
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50">
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Service</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Date & Time</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Technician</th>
                    <th className="text-center py-4 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-center py-4 px-4 font-medium text-gray-700">Priority</th>
                    <th className="text-center py-4 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment.id} className="border-b border-gray-200/30 hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.customer_name}</p>
                          <p className="text-sm text-gray-600">{appointment.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.service_type}</p>
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">{appointment.appointment_time} ({appointment.duration_minutes} min)</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-900">{appointment.technician_name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAppointmentStatusStyle(appointment.status)}`}>
                          {appointment.status === 'confirmed' && <CheckCircle size={12} className="mr-1" />}
                          {appointment.status === 'pending' && <Clock3 size={12} className="mr-1" />}
                          {appointment.status === 'completed' && <CheckCircle size={12} className="mr-1" />}
                          {appointment.status === 'cancelled' && <XCircle size={12} className="mr-1" />}
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityStyle(appointment.priority)}`}>
                          {appointment.priority === 'high' && <AlertTriangle size={12} className="mr-1" />}
                          {appointment.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {/* TODO: Edit appointment */}}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit Appointment"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                              setShowCustomerDetailModal(true);
                              markCustomerAsRead(customer.id);
                            }}
                            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {/* TODO: Call customer */}}
                            className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                            title="Call Customer"
                          >
                            <Phone size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <CalendarDays className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or create a new appointment</p>
                <GlassButton
                  onClick={() => {/* TODO: Add new appointment modal */}}
                  icon={<UserPlus2 size={18} />}
                >
                  Create Appointment
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* Customer-specific content - only show when customers tab is active */}
      {activeTab === 'customers' && (
        <>
          {/* Daily Birthday Card - DISABLED */}
          {/* {todaysBirthdays.length > 0 && (
            <div className="relative overflow-hidden">
              ... birthday widget content removed ...
            </div>
          )} */}

          {/* Revenue Breakdown */}
          {(stats.deviceRevenue > 0 || stats.posRevenue > 0) && (
        <GlassCard className="bg-gradient-to-br from-blue-50 to-indigo-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Device Repairs</p>
                  <p className="text-xs text-blue-600">Repair payments</p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(stats.deviceRevenue)}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-green-700">POS Sales</p>
                  <p className="text-xs text-green-600">Product sales</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-900">{formatCurrency(stats.posRevenue)}</p>
            </div>
          </div>
        </GlassCard>
      )}

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
              onClick={() => navigate('/finance/payments')}
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
        whatsappFilter={false}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        customers={customers}
        searchLoading={searchLoading}
      />

      {/* Background Search Indicator */}
      <BackgroundSearchIndicator
        isSearching={isBackgroundSearching}
        searchStatus={searchStatus}
        searchProgress={searchProgress}
        resultCount={filteredCustomers.length}
        onCancel={() => {
          if (currentSearchJobId) {
            const searchManager = getBackgroundSearchManager();
            searchManager.cancelSearchJob(currentSearchJobId);
            setIsBackgroundSearching(false);
            setCurrentSearchJobId(null);
          }
        }}
        className="mt-4"
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
        </>
      )}

      {/* Customers Display */}
      {viewMode === 'list' ? (
        <GlassCard>
          {pageLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm opacity-70">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          )}
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
                        setSelectedCustomer(customer);
                        setShowCustomerDetailModal(true);
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
                            <Phone className="w-3 h-3 text-blue-500" />
                            <span className="text-blue-600 font-medium">{customer.phone}</span>
                          </div>

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
                        {(() => {
                          const devicePayments = customer.payments?.filter(p => p.source === 'device_payment' && p.status === 'completed') || [];
                          const deviceTotal = devicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                          
                          if (deviceTotal > 0) {
                            return (
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                  <span>Repairs: {formatCurrency(deviceTotal)}</span>
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {/* Purchase Summary for List View */}
                        {(() => {
                          const purchaseSummary = getCustomerPurchaseSummary(customer.id);
                          if (purchaseSummary.totalPurchases > 0) {
                            return (
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                  <span>{purchaseSummary.totalPurchases} purchase{purchaseSummary.totalPurchases !== 1 ? 's' : ''} • {purchaseSummary.totalItems} items</span>
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
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
                              setSelectedCustomer(customer);
                              setShowCustomerDetailModal(true);
                              markCustomerAsRead(customer.id);
                              markCustomerAsRead(customer.id);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                                            <button
                    onClick={e => { e.stopPropagation(); setSelectedCustomer(customer); setShowCustomerDetailModal(true); markCustomerAsRead(customer.id); }}
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
        <div>
          {pageLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm opacity-70">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.map(customer => {
            const deviceInfo = getCustomerDeviceInfo(customer.id);
            return (
              <GlassCard
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerDetailModal(true);
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
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600 font-medium">{customer.phone}</span>
                </div>
                

                
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
                {/* Payment Sources Breakdown */}
                {(() => {
                  if (!customer?.payments?.length) return null;
                  
                  const devicePayments = customer.payments.filter(p => p.source === 'device_payment' && p.status === 'completed');
                  const deviceTotal = devicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  
                  if (deviceTotal > 0) {
                    return (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Repairs: {formatCurrency(deviceTotal)}</span>
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Purchase Summary */}
                {(() => {
                  const purchaseSummary = getCustomerPurchaseSummary(customer.id);
                  if (purchaseSummary.totalPurchases > 0) {
                    return (
                      <div className="text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>{purchaseSummary.totalPurchases} purchase{purchaseSummary.totalPurchases !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{purchaseSummary.totalItems} item{purchaseSummary.totalItems !== 1 ? 's' : ''}</span>
                        </div>
                        {purchaseSummary.lastPurchase && (
                          <div className="text-xs text-gray-400">
                            Last: {new Date(purchaseSummary.lastPurchase.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={e => { 
                      e.stopPropagation(); 
                      setSelectedCustomer(customer);
                      setShowCustomerDetailModal(true);
                      markCustomerAsRead(customer.id);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedCustomer(customer); setShowCustomerDetailModal(true); markCustomerAsRead(customer.id); }}
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
        </div>
      )}

      {/* Pagination Controls */}
      {filteredCustomers.length > 0 && (
        <GlassCard className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} customers
              {pageLoading && <span className="ml-2 text-gray-500 text-xs opacity-70">Loading...</span>}
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPreviousPage || pageLoading}
                className="px-3 py-1 text-sm"
                icon={<ChevronLeft size={16} />}
              >
                Previous
              </GlassButton>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={pageLoading}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:text-blue-600'
                      } ${pageLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
              </div>
              <GlassButton
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage || pageLoading}
                className="px-3 py-1 text-sm"
                icon={<ChevronRight size={16} />}
              >
                Next
              </GlassButton>
            </div>
          </div>
        </GlassCard>
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



      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerCreated={(customer) => {
          setShowAddCustomerModal(false);
          setSelectedCustomer(customer);
          setShowCustomerDetailModal(true);
          markCustomerAsRead(customer.id);
        }}
      />

      {/* Modals - Shared between tabs */}
      <BulkSMSModal
        open={showBulkSMS}
        onClose={() => setShowBulkSMS(false)}
        customers={customers}
        onSend={handleBulkSMSSend}
        sending={sendingSMS}
      />

      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImportComplete={handleExcelImportComplete}
      />

      <CustomerUpdateImportModal
        isOpen={showCustomerUpdateImport}
        onClose={() => setShowCustomerUpdateImport(false)}
        onImportComplete={handleCustomerUpdateImportComplete}
      />

      {/* Birthday Components */}
      {showBirthdayNotification && todaysBirthdays.length > 0 && (
        <BirthdayNotification
          todaysBirthdays={todaysBirthdays}
          onClose={() => setShowBirthdayNotification(false)}
          onViewCustomers={() => setShowBirthdayCalendar(true)}
        />
      )}

      {showBirthdayMessageSender && (
        <BirthdayMessageSender
          todaysBirthdays={todaysBirthdays}
          onClose={() => setShowBirthdayMessageSender(false)}
        />
      )}

      {showBirthdayCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Birthday Calendar</h2>
                <button
                  onClick={() => setShowBirthdayCalendar(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <BirthdayCalendar
                customers={customers}
                onCustomerClick={(customer) => {
                  setSelectedCustomer(customer);
                  setShowCustomerDetailModal(true);
                  markCustomerAsRead(customer.id);
                }}
              />
            </GlassCard>
          </div>
        </div>
      )}

      {showBirthdayRewards && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Birthday Rewards</h2>
                <button
                  onClick={() => setShowBirthdayRewards(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <BirthdayRewards
                todaysBirthdays={todaysBirthdays}
                onApplyReward={(customerId, rewardType) => {
                  console.log(`Applied ${rewardType} to customer ${customerId}`);
                  toast.success('Birthday reward applied successfully!');
                }}
              />
            </GlassCard>
          </div>
        </div>
      )}

      {/* All Birthday Customers Modal */}
      {showAllBirthdays && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Gift size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Birthday Customers</h2>
                    <p className="text-sm text-gray-600">{todaysBirthdays.length} customers celebrating today</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllBirthdays(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* All Birthday Customers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {todaysBirthdays.map((customer) => (
                  <div key={customer.id} className="group relative">
                    <div className="relative bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all duration-500 hover:scale-105 hover:-translate-y-1 overflow-hidden">
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/20 via-transparent to-fuchsia-50/20"></div>
                      
                      {/* Customer Info */}
                      <div className="relative z-10 flex items-center gap-3 mb-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            <span className="text-lg font-bold text-white relative z-10">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                            <span className="text-xs">🎂</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-base">
                            {customer.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {customer.birthMonth} {customer.birthDay}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-gray-400 mt-1">
                              📞 {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="relative z-10 flex items-center gap-2">
                        {customer.phone && (
                          <button 
                            onClick={() => window.open(`tel:${customer.phone}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-sm font-semibold rounded-lg hover:from-rose-600 hover:to-fuchsia-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                            title="Call customer"
                          >
                            <Phone size={14} />
                            Call
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedCustomer(customer); setShowCustomerDetailModal(true); markCustomerAsRead(customer.id); }}
                          className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                          title="View customer details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      
                      {/* Birthday Actions */}
                      <div className="relative z-10 flex gap-2 mt-3">
                        <button
                          onClick={() => setShowBirthdayMessageSender(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <span className="text-sm">💬</span>
                          Send Message
                        </button>
                        <button
                          onClick={() => setShowBirthdayRewards(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <span className="text-sm">🎁</span>
                          Give Reward
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Quick Actions:</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAllBirthdays(false);
                        setShowBirthdayMessageSender(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <MessageSquare size={16} />
                      Send All Messages
                    </button>
                    <button
                      onClick={() => {
                        setShowAllBirthdays(false);
                        setShowBirthdayRewards(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white text-sm font-semibold rounded-lg hover:from-fuchsia-600 hover:to-fuchsia-700 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Gift size={16} />
                      Apply All Rewards
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}


      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={showCustomerDetailModal}
          onClose={() => {
            setShowCustomerDetailModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onEdit={(customer) => {
            // Handle edit if needed
            console.log('Edit customer:', customer);
          }}
        />
      )}
    </div>
  );
};

export default CustomersPage;