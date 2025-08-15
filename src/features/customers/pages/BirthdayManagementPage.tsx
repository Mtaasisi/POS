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
import { fetchAllCustomers } from '../../../lib/customerApi';
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
        const allCustomers = await fetchAllCustomers();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Gift className="w-6 h-6 text-pink-600" />
              Birthday Management
            </h1>
            <p className="text-gray-600">Manage customer birthdays and celebrations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={() => setShowBirthdayMessageSender(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white"
            disabled={todaysBirthdays.length === 0}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Messages
          </GlassButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Birthdays</p>
                    <p className="text-2xl font-bold text-pink-600">{todaysBirthdays.length}</p>
                  </div>
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <Gift className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming (7 days)</p>
                    <p className="text-2xl font-bold text-purple-600">{upcomingBirthdays.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Today's Birthdays */}
            {todaysBirthdays.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-600" />
                  Today's Celebrations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaysBirthdays.map((customer) => (
                    <div key={customer.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <span className="text-pink-700 font-semibold">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{customer.name}</h4>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="text-pink-600 hover:text-pink-700"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Upcoming Birthdays (Next 7 Days)
                </h3>
                <div className="space-y-2">
                  {upcomingBirthdays.slice(0, 10).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{customer.name}</h4>
                          <p className="text-sm text-gray-600">
                            {customer.birthMonth} {customer.birthDay}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="text-purple-600 hover:text-purple-700 text-sm"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <BirthdayCalendar
            customers={customers}
            onCustomerClick={(customer) => navigate(`/customers/${customer.id}`)}
          />
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Birthday Messages</h3>
              <p className="text-gray-600 mb-4">
                Send personalized birthday messages to your customers via SMS or WhatsApp.
              </p>
              <GlassButton
                onClick={() => setShowBirthdayMessageSender(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white"
                disabled={todaysBirthdays.length === 0}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Birthday Messages
              </GlassButton>
            </GlassCard>
          </div>
        )}

        {activeTab === 'rewards' && (
          <BirthdayRewards
            todaysBirthdays={todaysBirthdays}
            onApplyReward={(customerId, rewardType) => {
              console.log(`Applied ${rewardType} to customer ${customerId}`);
              toast.success('Birthday reward applied successfully!');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Birthday Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Automatic Birthday Messages
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="text-pink-600" />
                    <span className="text-sm">Enable automatic SMS messages</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="text-pink-600" />
                    <span className="text-sm">Enable automatic WhatsApp messages</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Birthday Rewards
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>20% Birthday Discount</option>
                  <option>Free Device Diagnosis</option>
                  <option>Double Loyalty Points</option>
                  <option>Priority Service</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birthday Notification Time
                </label>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Birthday Message Sender Modal */}
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
