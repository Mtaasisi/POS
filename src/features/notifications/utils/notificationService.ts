import { supabase } from '../../../lib/supabaseClient';
import { 
  Notification, 
  NotificationType, 
  NotificationCategory, 
  NotificationPriority,
  NotificationSettings 
} from '../types';
import { notificationHelpers } from './notificationHelpers';

export class NotificationService {
  // Create a new notification
  static async createNotification(
    userId: string,
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const notification: Partial<Notification> = {
        id: notificationHelpers.generateNotificationId(),
        type,
        category,
        title,
        message,
        priority,
        status: 'unread',
        createdAt: new Date().toISOString(),
        metadata,
        icon: notificationHelpers.getNotificationIcon(type),
        color: notificationHelpers.getNotificationColor(priority)
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      return data as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Create device-related notification
  static async createDeviceNotification(
    userId: string,
    deviceId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal'
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'devices',
      title,
      message,
      priority,
      { deviceId }
    );
  }

  // Create customer-related notification
  static async createCustomerNotification(
    userId: string,
    customerId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal'
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'customers',
      title,
      message,
      priority,
      { customerId }
    );
  }

  // Create payment-related notification
  static async createPaymentNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'payments',
      title,
      message,
      priority,
      metadata
    );
  }

  // Create system notification
  static async createSystemNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal'
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'system',
      title,
      message,
      priority
    );
  }

  // Create inventory notification
  static async createInventoryNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'inventory',
      title,
      message,
      priority,
      metadata
    );
  }

  // Create diagnostic notification
  static async createDiagnosticNotification(
    userId: string,
    diagnosticId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal'
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'diagnostics',
      title,
      message,
      priority,
      { diagnosticId }
    );
  }

  // Create loyalty notification
  static async createLoyaltyNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'loyalty',
      title,
      message,
      priority,
      metadata
    );
  }

  // Create communication notification
  static async createCommunicationNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'communications',
      title,
      message,
      priority,
      metadata
    );
  }

  // Create backup notification
  static async createBackupNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'backup',
      title,
      message,
      priority,
      metadata
    );
  }

  // Create security notification
  static async createSecurityNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'high',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'security',
      title,
      message,
      priority,
      metadata
    );
  }

  // Create goal notification
  static async createGoalNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      type,
      'goals',
      title,
      message,
      priority,
      metadata
    );
  }

  // Get user notification settings
  static async getUserSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Handle 406 Not Acceptable errors (RLS policy issues)
        if (error.code === '406' || error.message?.includes('Not Acceptable')) {
          console.log('⚠️ 406 error for notification settings - RLS policy issue, returning default settings');
          return this.getDefaultSettings(userId);
        }
        
        // Handle no rows returned
        if (error.code === 'PGRST116') {
          console.log('📝 No notification settings found, creating default settings');
          return this.getDefaultSettings(userId);
        }
        
        // Handle any other database errors gracefully
        console.warn('⚠️ Database error for notification settings, using default settings:', error.message);
        return this.getDefaultSettings(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user notification settings:', error);
      // Return default settings on any error
      return this.getDefaultSettings(userId);
    }
  }

  // Get default notification settings
  private static getDefaultSettings(userId: string): NotificationSettings {
    return {
      id: '',
      userId: userId,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      whatsappNotifications: true,
      deviceNotifications: true,
      customerNotifications: true,
      paymentNotifications: true,
      inventoryNotifications: true,
      systemNotifications: true,
      appointmentNotifications: true,
      diagnosticNotifications: true,
      loyaltyNotifications: true,
      communicationNotifications: true,
      backupNotifications: true,
      securityNotifications: true,
      goalNotifications: true,
      lowPriorityNotifications: true,
      normalPriorityNotifications: true,
      highPriorityNotifications: true,
      urgentPriorityNotifications: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC',
      digestEnabled: false,
      digestFrequency: 'daily',
      digestTime: '09:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Check if user should receive notification based on settings
  static async shouldSendNotification(
    userId: string,
    category: NotificationCategory,
    priority: NotificationPriority
  ): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings) return true; // Default to true if no settings

      // Check category preference
      const categoryKey = `${category}Notifications` as keyof NotificationSettings;
      if (settings[categoryKey] === false) return false;

      // Check priority preference
      const priorityKey = `${priority}PriorityNotifications` as keyof NotificationSettings;
      if (settings[priorityKey] === false) return false;

      // Check quiet hours
      if (settings.quietHoursEnabled) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = parseInt(settings.quietHoursStart.split(':')[0]) * 60 + 
                         parseInt(settings.quietHoursStart.split(':')[1]);
        const endTime = parseInt(settings.quietHoursEnd.split(':')[0]) * 60 + 
                       parseInt(settings.quietHoursEnd.split(':')[1]);

        if (startTime <= endTime) {
          // Same day quiet hours
          if (currentTime >= startTime && currentTime <= endTime) return false;
        } else {
          // Overnight quiet hours
          if (currentTime >= startTime || currentTime <= endTime) return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // Default to true on error
    }
  }

  // Send notification with preference checking
  static async sendNotification(
    userId: string,
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      // Check if user should receive this notification
      const shouldSend = await this.shouldSendNotification(userId, category, priority);
      if (!shouldSend) {
        console.log(`Notification skipped for user ${userId} due to preferences`);
        return null;
      }

      // Create the notification
      const notification = await this.createNotification(
        userId,
        type,
        category,
        title,
        message,
        priority,
        metadata
      );

      if (notification) {
        // Send push notification if enabled
        const settings = await this.getUserSettings(userId);
        if (settings?.pushNotifications) {
          this.sendPushNotification(title, message);
        }

        // Send email notification if enabled
        if (settings?.emailNotifications) {
          this.sendEmailNotification(userId, title, message);
        }

        // Send SMS notification if enabled
        if (settings?.smsNotifications) {
          this.sendSMSNotification(userId, title, message);
        }

        // Send WhatsApp notification if enabled
        if (settings?.whatsappNotifications) {
          this.sendWhatsAppNotification(userId, title, message);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  // Send push notification
  private static sendPushNotification(title: string, message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.svg',
        badge: '/favicon.svg'
      });
    }
  }

  // Send email notification (placeholder)
  private static async sendEmailNotification(userId: string, title: string, message: string) {
    // Implement email sending logic
    console.log(`Email notification to ${userId}: ${title} - ${message}`);
  }

  // Send SMS notification (placeholder)
  private static async sendSMSNotification(userId: string, title: string, message: string) {
    // Implement SMS sending logic
    console.log(`SMS notification to ${userId}: ${title} - ${message}`);
  }

  // Send WhatsApp notification (placeholder)
  private static async sendWhatsAppNotification(userId: string, title: string, message: string) {
    // Implement WhatsApp sending logic
    console.log(`WhatsApp notification to ${userId}: ${title} - ${message}`);
  }

  // Bulk send notifications to multiple users
  static async sendBulkNotifications(
    userIds: string[],
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    priority: NotificationPriority = 'normal',
    metadata?: Record<string, any>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const notification = await this.sendNotification(
        userId,
        type,
        category,
        title,
        message,
        priority,
        metadata
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  // Delete old notifications
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { count, error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    read: number;
    actioned: number;
    dismissed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const notifications = data || [];
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => n.status === 'unread').length,
        read: notifications.filter(n => n.status === 'read').length,
        actioned: notifications.filter(n => n.status === 'actioned').length,
        dismissed: notifications.filter(n => n.status === 'dismissed').length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byType: {} as Record<string, number>
      };

      notifications.forEach(notification => {
        stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        actioned: 0,
        dismissed: 0,
        byCategory: {},
        byPriority: {},
        byType: {}
      };
    }
  }
}
