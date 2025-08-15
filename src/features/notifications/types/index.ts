export type NotificationType = 
  | 'device_status_change'
  | 'new_customer'
  | 'payment_received'
  | 'inventory_low'
  | 'system_alert'
  | 'appointment_reminder'
  | 'diagnostic_complete'
  | 'repair_complete'
  | 'customer_feedback'
  | 'whatsapp_message'
  | 'backup_complete'
  | 'security_alert'
  | 'goal_achieved'
  | 'overdue_device'
  | 'new_remark'
  | 'loyalty_points'
  | 'bulk_sms_sent'
  | 'export_complete';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'actioned' | 'dismissed';

export type NotificationCategory = 
  | 'devices'
  | 'customers'
  | 'payments'
  | 'inventory'
  | 'system'
  | 'appointments'
  | 'diagnostics'
  | 'loyalty'
  | 'communications'
  | 'backup'
  | 'security'
  | 'goals';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  actionedAt?: string;
  dismissedAt?: string;
  actionedBy?: string;
  dismissedBy?: string;
  
  // Related data
  deviceId?: string;
  customerId?: string;
  userId?: string;
  appointmentId?: string;
  diagnosticId?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  icon?: string;
  color?: string;
  actionUrl?: string;
  actionText?: string;
  
  // Grouping
  groupId?: string;
  isGrouped?: boolean;
  groupCount?: number;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  notifications: Notification[];
  unreadCount: number;
  createdAt: string;
  latestNotification: Notification;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  
  // Category preferences
  deviceNotifications: boolean;
  customerNotifications: boolean;
  paymentNotifications: boolean;
  inventoryNotifications: boolean;
  systemNotifications: boolean;
  appointmentNotifications: boolean;
  diagnosticNotifications: boolean;
  loyaltyNotifications: boolean;
  communicationNotifications: boolean;
  backupNotifications: boolean;
  securityNotifications: boolean;
  goalNotifications: boolean;
  
  // Priority preferences
  lowPriorityNotifications: boolean;
  normalPriorityNotifications: boolean;
  highPriorityNotifications: boolean;
  urgentPriorityNotifications: boolean;
  
  // Time preferences
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  timezone: string;
  
  // Frequency preferences
  digestEnabled: boolean;
  digestFrequency: 'hourly' | 'daily' | 'weekly';
  digestTime: string; // HH:mm format
  
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  actioned: number;
  dismissed: number;
  
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
  
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface NotificationFilters {
  status?: NotificationStatus[];
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  type?: NotificationType[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  userId?: string;
  deviceId?: string;
  customerId?: string;
}

export interface NotificationAction {
  id: string;
  notificationId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  icon?: string;
  color?: string;
  actionText?: string;
  actionUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
