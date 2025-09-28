import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Calendar, Clock, User, TrendingUp, BarChart3, 
  CheckCircle, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAppointmentStats, fetchAllAppointments } from '../../../lib/customerApi/appointments';

interface AppointmentStatsTabProps {
  isActive: boolean;
}

interface AppointmentStats {
  overview: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    trend: number;
  }>;
  byService: Array<{
    service: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  byTechnician: Array<{
    technician: string;
    appointments: number;
    completed: number;
    rating: number;
  }>;
  trends: Array<{
    date: string;
    appointments: number;
    completed: number;
    cancelled: number;
  }>;
}

const AppointmentStatsTab: React.FC<AppointmentStatsTabProps> = ({ isActive }) => {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (isActive) {
      loadAppointmentStats();
    }
  }, [isActive, timeRange]);

  const loadAppointmentStats = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading appointment statistics from database...');
      const [statsData, appointmentsData] = await Promise.all([
        getAppointmentStats(),
        fetchAllAppointments()
      ]);
      
      // Calculate additional stats from appointments data
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Count appointments by time period
      const todayCount = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today;
      }).length;
      
      const thisWeekCount = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= thisWeek;
      }).length;
      
      const thisMonthCount = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= thisMonth;
      }).length;
      
      // Calculate growth (simplified)
      const growth = thisMonthCount > 0 ? ((todayCount / thisMonthCount) * 100 - 100) : 0;
      
      // Group by status
      const byStatus = appointmentsData.reduce((acc, apt) => {
        const existing = acc.find(item => item.status === apt.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: apt.status, count: 1 });
        }
        return acc;
      }, [] as { status: string; count: number }[]);
      
      // Group by service type
      const byService = appointmentsData.reduce((acc, apt) => {
        const existing = acc.find(item => item.service === apt.service_type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ service: apt.service_type, count: 1 });
        }
        return acc;
      }, [] as { service: string; count: number }[]);
      
      const stats: AppointmentStats = {
        overview: {
          total: statsData.total || 0,
          today: todayCount,
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount,
          growth: Math.round(growth)
        },
        byStatus,
        byService,
        byTechnician: [], // Will be populated if technician data is available
        trends: [] // Will be populated with historical data if needed
      };
      
      setStats(stats);
      console.log('✅ Appointment statistics loaded successfully');
    } catch (error) {
      console.error('Error loading appointment stats:', error);
      toast.error('Failed to load appointment statistics');
      
      // Set default stats on error
      setStats({
        overview: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          growth: 0
        },
        byStatus: [],
        byService: [],
        byTechnician: [],
        trends: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'in progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-purple-600 bg-purple-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Loading appointment statistics...</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.overview.total)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{stats.overview.growth}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview.today}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview.thisWeek}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.3%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview.thisMonth}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+15.2%</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Status Breakdown */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Status</h3>
        <div className="space-y-3">
          {stats.byStatus.map((status, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                  {status.status}
                </span>
                <span className="ml-3 text-sm text-gray-600">{status.count} appointments</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{status.percentage}%</p>
                <div className="flex items-center">
                  {status.trend > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ml-1 ${status.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {status.trend > 0 ? '+' : ''}{status.trend}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Service Breakdown */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Service</h3>
        <div className="space-y-3">
          {stats.byService.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{service.service}</p>
                <p className="text-sm text-gray-600">{service.count} appointments</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMoney(service.revenue)}</p>
                <p className="text-sm text-gray-600">{service.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Technician Performance */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
        <div className="space-y-3">
          {stats.byTechnician.map((tech, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{tech.technician}</p>
                <p className="text-sm text-gray-600">
                  {tech.completed}/{tech.appointments} completed
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold text-gray-900 ml-1">{tech.rating}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {Math.round((tech.completed / tech.appointments) * 100)}% success
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Weekly Trends */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h3>
        <div className="grid grid-cols-7 gap-2">
          {stats.trends.map((day, index) => (
            <div key={index} className="text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{day.date}</p>
                <p className="text-lg font-bold text-blue-600">{day.appointments}</p>
                <div className="text-xs text-gray-600">
                  <p className="text-green-600">{day.completed} completed</p>
                  <p className="text-red-600">{day.cancelled} cancelled</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default AppointmentStatsTab;
