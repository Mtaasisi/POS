import { 
  Notification, 
  NotificationType, 
  NotificationCategory, 
  NotificationPriority,
  NotificationGroup 
} from '../types';

export const notificationHelpers = {
  // Format notification time
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  },

  // Get notification icon based on type
  getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      device_status_change: '📱',
      new_customer: '👤',
      payment_received: '💰',
      inventory_low: '📦',
      system_alert: '⚠️',
      appointment_reminder: '📅',
      diagnostic_complete: '🔍',
      repair_complete: '✅',
      customer_feedback: '💬',
      whatsapp_message: '📱',
      backup_complete: '💾',
      security_alert: '🔒',
      goal_achieved: '🎯',
      overdue_device: '⏰',
      new_remark: '💭',
      loyalty_points: '⭐',
      bulk_sms_sent: '📨',
      export_complete: '📊'
    };
    return iconMap[type] || '🔔';
  },

  // Get notification color based on priority
  getNotificationColor(priority: NotificationPriority): string {
    const colorMap: Record<NotificationPriority, string> = {
      low: 'text-gray-500 bg-gray-50',
      normal: 'text-blue-600 bg-blue-50',
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    };
    return colorMap[priority] || colorMap.normal;
  },

  // Get notification border color based on priority
  getNotificationBorderColor(priority: NotificationPriority): string {
    const borderMap: Record<NotificationPriority, string> = {
      low: 'border-gray-200',
      normal: 'border-blue-200',
      high: 'border-orange-200',
      urgent: 'border-red-200'
    };
    return borderMap[priority] || borderMap.normal;
  },

  // Get category display name
  getCategoryDisplayName(category: NotificationCategory): string {
    const categoryMap: Record<NotificationCategory, string> = {
      devices: 'Devices',
      customers: 'Customers',
      payments: 'Payments',
      inventory: 'Inventory',
      system: 'System',
      appointments: 'Appointments',
      diagnostics: 'Diagnostics',
      loyalty: 'Loyalty',
      communications: 'Communications',
      backup: 'Backup',
      security: 'Security',
      goals: 'Goals'
    };
    return categoryMap[category] || category;
  },

  // Get priority display name
  getPriorityDisplayName(priority: NotificationPriority): string {
    const priorityMap: Record<NotificationPriority, string> = {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent'
    };
    return priorityMap[priority] || priority;
  },

  // Group notifications by type and time
  groupNotifications(notifications: Notification[]): NotificationGroup[] {
    const groups: Record<string, NotificationGroup> = {};
    
    notifications.forEach(notification => {
      const key = `${notification.type}_${notification.category}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          type: notification.type,
          category: notification.category,
          title: this.getCategoryDisplayName(notification.category),
          notifications: [],
          unreadCount: 0,
          createdAt: notification.createdAt,
          latestNotification: notification
        };
      }
      
      groups[key].notifications.push(notification);
      if (notification.status === 'unread') {
        groups[key].unreadCount++;
      }
      
      // Update latest notification
      if (new Date(notification.createdAt) > new Date(groups[key].latestNotification.createdAt)) {
        groups[key].latestNotification = notification;
        groups[key].createdAt = notification.createdAt;
      }
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Filter notifications
  filterNotifications(
    notifications: Notification[], 
    filters: {
      status?: string[];
      category?: string[];
      priority?: string[];
      type?: string[];
      search?: string;
    }
  ): Notification[] {
    return notifications.filter(notification => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(notification.status)) return false;
      }
      
      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(notification.category)) return false;
      }
      
      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(notification.priority)) return false;
      }
      
      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(notification.type)) return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = notification.title.toLowerCase().includes(searchTerm);
        const matchesMessage = notification.message.toLowerCase().includes(searchTerm);
        if (!matchesTitle && !matchesMessage) return false;
      }
      
      return true;
    });
  },

  // Sort notifications
  sortNotifications(
    notifications: Notification[], 
    sortBy: 'date' | 'priority' | 'category' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Notification[] {
    return [...notifications].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  },

  // Check if notification is recent (within last 24 hours)
  isRecent(notification: Notification): boolean {
    const now = new Date();
    const notificationDate = new Date(notification.createdAt);
    const diffInHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  },

  // Get notification summary for grouped notifications
  getGroupSummary(group: NotificationGroup): string {
    const { notifications, unreadCount } = group;
    
    if (notifications.length === 1) {
      return notifications[0].message;
    }
    
    if (unreadCount > 0) {
      return `${unreadCount} new ${group.type.replace('_', ' ')} notification${unreadCount > 1 ? 's' : ''}`;
    }
    
    return `${notifications.length} ${group.type.replace('_', ' ')} notification${notifications.length > 1 ? 's' : ''}`;
  },

  // Generate notification ID
  generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Validate notification data
  validateNotification(notification: Partial<Notification>): boolean {
    const requiredFields = ['type', 'category', 'title', 'message', 'priority'];
    return requiredFields.every(field => notification[field as keyof Notification] !== undefined);
  }
};
