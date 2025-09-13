import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Calendar, Clock, User, TrendingUp, BarChart3, 
  CheckCircle, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      // Mock appointment statistics
      const mockStats: AppointmentStats = {
        overview: {
          total: 1247,
          today: 5,
          thisWeek: 28,
          thisMonth: 156,
          growth: 12.5
        },
        byStatus: [
          { status: 'Scheduled', count: 45, percentage: 36.0, trend: 8.5 },
          { status: 'Confirmed', count: 32, percentage: 25.6, trend: 12.3 },
          { status: 'In Progress', count: 18, percentage: 14.4, trend: -2.1 },
          { status: 'Completed', count: 25, percentage: 20.0, trend: 15.7 },
          { status: 'Cancelled', count: 5, percentage: 4.0, trend: -5.2 }
        ],
        byService: [
          { service: 'iPhone Screen Replacement', count: 28, revenue: 2240000, percentage: 22.4 },
          { service: 'Laptop Diagnostics', count: 22, revenue: 330000, percentage: 17.6 },
          { service: 'Data Recovery', count: 15, revenue: 1125000, percentage: 12.0 },
          { service: 'Virus Removal', count: 20, revenue: 400000, percentage: 16.0 },
          { service: 'Windows Installation', count: 18, revenue: 450000, percentage: 14.4 },
          { service: 'Other Services', count: 22, revenue: 1100000, percentage: 17.6 }
        ],
        byTechnician: [
          { technician: 'Mike Johnson', appointments: 45, completed: 42, rating: 4.8 },
          { technician: 'Lisa Brown', appointments: 38, completed: 36, rating: 4.9 },
          { technician: 'David Lee', appointments: 32, completed: 30, rating: 4.7 },
          { technician: 'Sarah Wilson', appointments: 28, completed: 26, rating: 4.6 },
          { technician: 'Alex Chen', appointments: 25, completed: 23, rating: 4.5 }
        ],
        trends: [
          { date: 'Mon', appointments: 8, completed: 7, cancelled: 1 },
          { date: 'Tue', appointments: 12, completed: 11, cancelled: 1 },
          { date: 'Wed', appointments: 6, completed: 5, cancelled: 1 },
          { date: 'Thu', appointments: 15, completed: 14, cancelled: 1 },
          { date: 'Fri', appointments: 10, completed: 9, cancelled: 1 },
          { date: 'Sat', appointments: 18, completed: 17, cancelled: 1 },
          { date: 'Sun', appointments: 7, completed: 6, cancelled: 1 }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading appointment stats:', error);
      toast.error('Failed to load appointment statistics');
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
