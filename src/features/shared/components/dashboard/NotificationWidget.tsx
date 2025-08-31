import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, Check, X, ExternalLink } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService, NotificationSummary } from '../../../../services/dashboardService';
import { useAuth } from '../../../../context/AuthContext';

interface NotificationWidgetProps {
  className?: string;
}

export const NotificationWidget: React.FC<NotificationWidgetProps> = ({ className }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
    }
  }, [currentUser?.id]);

  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    
    try {
      setIsLoading(true);
      const [recentNotifications, stats] = await Promise.all([
        dashboardService.getRecentNotifications(currentUser.id, 4),
        dashboardService.getDashboardStats(currentUser.id)
      ]);
      
      setNotifications(recentNotifications);
      setUnreadCount(stats.unreadNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
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
          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <AlertCircle size={12} />
            {unreadCount}
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                  <AlertCircle size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {notification.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No new notifications</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/notifications')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          View All
        </GlassButton>
        {unreadCount > 0 && (
          <GlassButton
            onClick={loadNotifications}
            variant="ghost"
            size="sm"
            icon={<Check size={14} />}
          >
            Refresh
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
};