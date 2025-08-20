import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { 
  Notification, 
  NotificationStatus, 
  NotificationFilters,
  NotificationStats 
} from '../types';
import { notificationHelpers } from '../utils/notificationHelpers';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    actioned: 0,
    dismissed: 0,
    byCategory: {} as any,
    byPriority: {} as any,
    byType: {} as any,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }
      if (filters.deviceId) {
        query = query.eq('device_id', filters.deviceId);
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter in memory
      let filteredData = data || [];
      if (filters.search) {
        filteredData = notificationHelpers.filterNotifications(
          filteredData as Notification[], 
          { search: filters.search }
        );
      }

      setNotifications(filteredData as Notification[]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters]);

  // Calculate stats
  const calculateStats = useCallback((notifications: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      read: notifications.filter(n => n.status === 'read').length,
      actioned: notifications.filter(n => n.status === 'actioned').length,
      dismissed: notifications.filter(n => n.status === 'dismissed').length,
      byCategory: {} as any,
      byPriority: {} as any,
      byType: {} as any,
      today: notifications.filter(n => new Date(n.createdAt) >= today).length,
      thisWeek: notifications.filter(n => new Date(n.createdAt) >= weekAgo).length,
      thisMonth: notifications.filter(n => new Date(n.createdAt) >= monthAgo).length
    };

    // Calculate category stats
    notifications.forEach(notification => {
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  }, []);

  // Update notification status
  const updateNotificationStatus = useCallback(async (
    notificationId: string, 
    status: NotificationStatus,
    userId?: string
  ) => {
    if (!currentUser) return;

    try {
      const updateData: any = { status };
      
      if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'actioned') {
        updateData.actioned_at = new Date().toISOString();
        updateData.actioned_by = userId || currentUser.id;
      } else if (status === 'dismissed') {
        updateData.dismissed_at = new Date().toISOString();
        updateData.dismissed_by = userId || currentUser.id;
      }

      const { error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, ...updateData }
            : notification
        )
      );
    } catch (err) {
      console.error('Error updating notification status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update notification');
    }
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    return updateNotificationStatus(notificationId, 'read');
  }, [updateNotificationStatus]);

  // Mark notification as actioned
  const markAsActioned = useCallback((notificationId: string, userId?: string) => {
    return updateNotificationStatus(notificationId, 'actioned', userId);
  }, [updateNotificationStatus]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string, userId?: string) => {
    return updateNotificationStatus(notificationId, 'dismissed', userId);
  }, [updateNotificationStatus]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .eq('status', 'unread');

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.status === 'unread'
            ? { ...notification, status: 'read', readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [currentUser]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear notifications');
    }
  }, [currentUser]);

  // Filtered and sorted notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(n => filters.status!.includes(n.status));
    }
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(n => filters.category!.includes(n.category));
    }
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(n => filters.priority!.includes(n.priority));
    }
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(n => filters.type!.includes(n.type));
    }
    if (filters.search) {
      filtered = notificationHelpers.filterNotifications(filtered, { search: filters.search });
    }

    // Sort by date (newest first)
    return notificationHelpers.sortNotifications(filtered, 'date', 'desc');
  }, [notifications, filters]);

  // Unread notifications
  const unreadNotifications = useMemo(() => {
    return filteredNotifications.filter(n => n.status === 'unread');
  }, [filteredNotifications]);

  // Recent notifications (last 24 hours)
  const recentNotifications = useMemo(() => {
    return filteredNotifications.filter(n => notificationHelpers.isRecent(n));
  }, [filteredNotifications]);

  // Update stats when notifications change
  useEffect(() => {
    const newStats = calculateStats(notifications);
    setStats(newStats);
  }, [notifications, calculateStats]);

  // Fetch notifications on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  return {
    notifications: filteredNotifications,
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
    refetch: fetchNotifications
  };
};
