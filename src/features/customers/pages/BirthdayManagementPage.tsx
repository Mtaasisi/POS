import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Customer } from '../../../types';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Gift, Calendar, MessageSquare, Smartphone, Award, Users, 
  ChevronLeft, ChevronRight, Bell, Settings, BarChart3
} from 'lucide-react';
import BirthdayNotification from '../components/BirthdayNotification';
import BirthdayMessageSender from '../components/BirthdayMessageSender';
import BirthdayCalendar from '../components/BirthdayCalendar';
import BirthdayRewards from '../components/BirthdayRewards';
import { fetchAllCustomersSimple } from '../../../lib/customerApi';
import { toast } from 'react-hot-toast';

type TabType = 'overview' | 'calendar' | 'messages' | 'rewards' | 'settings';

const BirthdayManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBirthdayMessageSender, setShowBirthdayMessageSender] = useState(false);

  // Birthday calculations
  const todaysBirthdays = React.useMemo(() => {
    const customersArray = customers || [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    return customersArray.filter(customer => {
      if (!customer.birthMonth || !customer.birthDay) return false;
      
      let customerMonth: number;
      let customerDay: number;
      
      if (typeof customer.birthMonth === 'string') {
        if (customer.birthMonth.trim() === '') return false;
        
        const numericMonth = parseInt(customer.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          customerMonth = numericMonth;
        } else {
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          customerMonth = monthNames.indexOf(customer.birthMonth.toLowerCase()) + 1;
        }
      } else {
        return false;
      }
      
      if (typeof customer.birthDay === 'string') {
        if (customer.birthDay.trim() === '') return false;
        
        const dayMatch = customer.birthDay.match(/^(\d+)/);
        if (dayMatch) {
          customerDay = parseInt(dayMatch[1]);
        } else {
          customerDay = parseInt(customer.birthDay);
        }
      } else {
        customerDay = parseInt(customer.birthDay);
      }
      
      return customerMonth === currentMonth && customerDay === currentDay;
    });
  }, [customers]);

  const upcomingBirthdays = React.useMemo(() => {
    const customersArray = customers || [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return customersArray.filter(customer => {
      if (!customer.birthMonth || !customer.birthDay) return false;
      
      let customerMonth: number;
      let customerDay: number;
      
      if (typeof customer.birthMonth === 'string') {
        if (customer.birthMonth.trim() === '') return false;
        
        const numericMonth = parseInt(customer.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          customerMonth = numericMonth;
        } else {
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          customerMonth = monthNames.indexOf(customer.birthMonth.toLowerCase()) + 1;
        }
      } else {
        return false;
      }
      
      if (typeof customer.birthDay === 'string') {
        if (customer.birthDay.trim() === '') return false;
        
        const dayMatch = customer.birthDay.match(/^(\d+)/);
        if (dayMatch) {
          customerDay = parseInt(dayMatch[1]);
        } else {
          customerDay = parseInt(customer.birthDay);
        }
      } else {
        customerDay = parseInt(customer.birthDay);
      }
      
      const birthdayThisYear = new Date(today.getFullYear(), customerMonth - 1, customerDay);
      
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
      }
      
      return birthdayThisYear >= today && birthdayThisYear <= nextWeek;
    }).sort((a, b) => {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const aMonth = monthNames.indexOf(a.birthMonth?.toLowerCase() || '') + 1;
      const bMonth = monthNames.indexOf(b.birthMonth?.toLowerCase() || '') + 1;
      const aDay = parseInt(a.birthDay || '0');
      const bDay = parseInt(b.birthDay || '0');
      
      const aDate = new Date(today.getFullYear(), aMonth - 1, aDay);
      const bDate = new Date(today.getFullYear(), bMonth - 1, bDay);
      
      if (aDate < today) aDate.setFullYear(today.getFullYear() + 1);
      if (bDate < today) bDate.setFullYear(today.getFullYear() + 1);
      
      return aDate.getTime() - bDate.getTime();
    });
  }, [customers]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const allCustomers = await fetchAllCustomersSimple();
        setCustomers(allCustomers);
      } catch (error) {
        console.error('Error loading customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'rewards', name: 'Rewards', icon: Award },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      {showBirthdayMessageSender && (
        <BirthdayMessageSender
          todaysBirthdays={todaysBirthdays}
          onClose={() => setShowBirthdayMessageSender(false)}
        />
      )}
    </div>
  );
};

export default BirthdayManagementPage;
