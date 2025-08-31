import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Users, Smartphone, CreditCard, Calendar, Package, 
  ExternalLink, Clock, DollarSign, CheckCircle, AlertTriangle 
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService, RecentActivity } from '../../../../services/dashboardService';

interface ActivityFeedWidgetProps {
  className?: string;
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Set up periodic refresh
    const interval = setInterval(loadActivities, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      if (isLoading) setIsLoading(true);
      const recentActivities = await dashboardService.getRecentActivities(8);
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'device': return <Smartphone size={16} className="text-blue-600" />;
      case 'customer': return <Users size={16} className="text-green-600" />;
      case 'payment': return <CreditCard size={16} className="text-emerald-600" />;
      case 'appointment': return <Calendar size={16} className="text-purple-600" />;
      case 'inventory': return <Package size={16} className="text-orange-600" />;
      case 'employee': return <Users size={16} className="text-indigo-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'device': return 'bg-blue-100';
      case 'customer': return 'bg-green-100';
      case 'payment': return 'bg-emerald-100';
      case 'appointment': return 'bg-purple-100';
      case 'inventory': return 'bg-orange-100';
      case 'employee': return 'bg-indigo-100';
      default: return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={12} className="text-green-600" />;
      case 'pending': return <Clock size={12} className="text-orange-600" />;
      case 'failed': return <AlertTriangle size={12} className="text-red-600" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-400';
      case 'high': return 'border-l-orange-400';
      case 'normal': return 'border-l-blue-400';
      default: return 'border-l-gray-300';
    }
  };

  const getTimeAgo = (timeString: string) => {
    const now = new Date();
    const time = new Date(timeString);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading && activities.length === 0) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg">
            <Activity className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600">Live system activities</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className={`p-3 bg-white rounded-lg border-l-4 ${getPriorityColor(activity.priority)}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${getActivityBgColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {activity.title}
                    </p>
                    {activity.status && getStatusIcon(activity.status)}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(activity.time)}
                    </span>
                    {activity.amount && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={10} className="text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          {formatCurrency(activity.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No recent activities</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/reports')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          View Reports
        </GlassButton>
        <GlassButton
          onClick={loadActivities}
          variant="ghost"
          size="sm"
          icon={<Activity size={14} />}
        >
          Refresh
        </GlassButton>
      </div>
    </GlassCard>
  );
};