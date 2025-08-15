import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  RefreshCw, 
  Settings,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from '../components/NotificationCard';
import NotificationFilters from '../components/NotificationFilters';
import { Notification } from '../types';
import { notificationHelpers } from '../utils/notificationHelpers';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadNotifications,
    recentNotifications,
    loading,
    error,
    stats,
    filters,
    setFilters,
    markAsRead,
    markAsActioned,
    dismissNotification,
    markAllAsRead,
    clearAllNotifications,
    refetch
  } = useNotifications();

  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  const displayedNotifications = React.useMemo(() => {
    let filtered = notifications;
    
    switch (viewMode) {
      case 'unread':
        filtered = unreadNotifications;
        break;
      case 'recent':
        filtered = recentNotifications;
        break;
      default:
        filtered = notifications;
    }

    return notificationHelpers.sortNotifications(filtered, sortBy, sortOrder);
  }, [notifications, unreadNotifications, recentNotifications, viewMode, sortBy, sortOrder]);

  const handleNotificationAction = (notification: Notification) => {
    // Handle notification-specific actions
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    // Add more specific actions based on notification type
    switch (notification.type) {
      case 'device_status_change':
        // Navigate to device page
        break;
      case 'new_customer':
        // Navigate to customer page
        break;
      case 'payment_received':
        // Navigate to payments page
        break;
      default:
        break;
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === displayedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(displayedNotifications.map(n => n.id)));
    }
  };

  const handleBulkAction = async (action: 'read' | 'dismiss' | 'delete') => {
    const selectedIds = Array.from(selectedNotifications);
    
    try {
      switch (action) {
        case 'read':
          await Promise.all(selectedIds.map(id => markAsRead(id)));
          break;
        case 'dismiss':
          await Promise.all(selectedIds.map(id => dismissNotification(id)));
          break;
        case 'delete':
          // Implement bulk delete
          break;
      }
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getStatsCard = (title: string, value: number, icon: React.ReactNode, color: string) => (
    <div className={`p-4 rounded-xl border ${color} bg-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-100">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Stay updated with all your important alerts and updates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Toggle filters"
            >
              <Filter size={20} />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Notification settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStatsCard(
            'Total Notifications',
            stats.total,
            <Bell size={20} className="text-gray-600" />,
            'border-gray-200'
          )}
          {getStatsCard(
            'Unread',
            stats.unread,
            <Eye size={20} className="text-blue-600" />,
            'border-blue-200'
          )}
          {getStatsCard(
            'Today',
            stats.today,
            <Calendar size={20} className="text-green-600" />,
            'border-green-200'
          )}
          {getStatsCard(
            'This Week',
            stats.thisWeek,
            <TrendingUp size={20} className="text-purple-600" />,
            'border-purple-200'
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <NotificationFilters
            filters={filters}
            onFiltersChange={setFilters}
            stats={stats}
          />
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'all', label: 'All', icon: Bell },
                  { key: 'unread', label: 'Unread', icon: Eye },
                  { key: 'recent', label: 'Recent', icon: Clock }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key as any)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${viewMode === key 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="priority">Priority</option>
                  <option value="category">Category</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk Actions */}
              {selectedNotifications.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedNotifications.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Mark as read
                  </button>
                  <button
                    onClick={() => handleBulkAction('dismiss')}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Global Actions */}
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {selectedNotifications.size === displayedNotifications.length ? 'Deselect all' : 'Select all'}
              </button>
              <button
                onClick={markAllAsRead}
                disabled={stats.unread === 0}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark all as read
              </button>
              <button
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {displayedNotifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Bell size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {viewMode === 'all' 
                  ? "You're all caught up! No notifications to show."
                  : viewMode === 'unread'
                  ? "No unread notifications at the moment."
                  : "No recent notifications to display."
                }
              </p>
            </div>
          ) : (
            displayedNotifications.map((notification) => (
              <div key={notification.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedNotifications.has(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                  className="absolute top-4 left-4 z-10 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-8">
                  <NotificationCard
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onMarkAsActioned={markAsActioned}
                    onDismiss={dismissNotification}
                    onAction={handleNotificationAction}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {notifications.length > 0 && (
          <div className="text-center">
            <button
              onClick={refetch}
              disabled={loading}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
