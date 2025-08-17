const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const sampleNotifications = [
  {
    type: 'device_status_change',
    category: 'devices',
    title: 'Device Status Updated',
    message: 'iPhone 12 status has been updated to "In Repair"',
    priority: 'normal',
    deviceId: '550e8400-e29b-41d4-a716-446655440000'
  },
  {
    type: 'new_customer',
    category: 'customers',
    title: 'New Customer Registered',
    message: 'John Doe has been registered as a new customer',
    priority: 'normal',
    customerId: '550e8400-e29b-41d4-a716-446655440001'
  },
  {
    type: 'payment_received',
    category: 'payments',
    title: 'Payment Received',
    message: 'Payment of $150 has been received for Samsung Galaxy repair',
    priority: 'normal'
  },
  {
    type: 'inventory_low',
    category: 'inventory',
    title: 'Low Inventory Alert',
    message: 'iPhone 12 screens are running low on stock (Quantity: 3)',
    priority: 'high'
  },
  {
    type: 'system_alert',
    category: 'system',
    title: 'System Alert',
    message: 'Database backup completed successfully',
    priority: 'normal'
  },
  {
    type: 'appointment_reminder',
    category: 'appointments',
    title: 'Appointment Reminder',
    message: 'You have an appointment scheduled for tomorrow at 2:00 PM',
    priority: 'normal'
  },
  {
    type: 'diagnostic_complete',
    category: 'diagnostics',
    title: 'Diagnostic Complete',
    message: 'Diagnostic for MacBook Pro has been completed',
    priority: 'normal'
  },
  {
    type: 'repair_complete',
    category: 'devices',
    title: 'Repair Complete',
    message: 'Repair for iPhone 13 has been completed successfully',
    priority: 'normal'
  },
  {
    type: 'customer_feedback',
    category: 'customers',
    title: 'Customer Feedback',
    message: 'New feedback received from Jane Smith',
    priority: 'normal'
  },
  {
    type: 'whatsapp_message',
    category: 'communications',
    title: 'New WhatsApp Message',
    message: 'New message received from customer support',
    priority: 'normal'
  },
  {
    type: 'backup_complete',
    category: 'backup',
    title: 'Backup Complete',
    message: 'Database backup has been completed successfully',
    priority: 'normal'
  },
  {
    type: 'security_alert',
    category: 'security',
    title: 'Security Alert',
    message: 'Multiple failed login attempts detected',
    priority: 'urgent'
  },
  {
    type: 'goal_achieved',
    category: 'goals',
    title: 'Goal Achieved',
    message: 'Congratulations! You have achieved your daily repair goal',
    priority: 'normal'
  },
  {
    type: 'overdue_device',
    category: 'devices',
    title: 'Overdue Device',
    message: 'iPad Pro is overdue for pickup by 2 days',
    priority: 'high'
  },
  {
    type: 'new_remark',
    category: 'devices',
    title: 'New Remark',
    message: 'New remark added to device repair notes',
    priority: 'normal'
  },
  {
    type: 'loyalty_points',
    category: 'loyalty',
    title: 'Loyalty Points Update',
    message: 'Customer has earned 50 loyalty points for their purchase',
    priority: 'normal'
  },
  {
    type: 'bulk_sms_sent',
    category: 'communications',
    title: 'Bulk SMS Sent',
    message: 'Bulk SMS has been sent to 25 customers',
    priority: 'normal'
  },
  {
    type: 'export_complete',
    category: 'system',
    title: 'Export Complete',
    message: 'Customer data export has been completed successfully',
    priority: 'normal'
  }
];

async function addSampleNotifications() {
  try {
    console.log('Adding sample notifications...');

    // Get current user (you'll need to replace this with actual user ID)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }

    const userId = user.id;
    console.log('User ID:', userId);

    // Add notifications with different statuses and timestamps
    for (let i = 0; i < sampleNotifications.length; i++) {
      const notification = sampleNotifications[i];
      
      // Create different timestamps (some recent, some older)
      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - (i * 2)); // Each notification 2 hours apart
      
      // Some notifications should be read
      const status = i < 5 ? 'unread' : (i < 10 ? 'read' : 'actioned');
      const readAt = status === 'read' || status === 'actioned' ? new Date(createdAt.getTime() + 1000 * 60 * 30) : null; // 30 minutes later
      const actionedAt = status === 'actioned' ? new Date(createdAt.getTime() + 1000 * 60 * 60) : null; // 1 hour later

      const notificationData = {
        user_id: userId,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        status: status,
        created_at: createdAt.toISOString(),
        read_at: readAt?.toISOString(),
        actioned_at: actionedAt?.toISOString(),
        device_id: notification.deviceId || null,
        customer_id: notification.customerId || null,
        icon: getNotificationIcon(notification.type),
        color: getNotificationColor(notification.priority)
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        console.error(`Error adding notification ${i + 1}:`, error);
      } else {
        console.log(`Added notification ${i + 1}: ${notification.title}`);
      }
    }

    console.log('Sample notifications added successfully!');
  } catch (error) {
    console.error('Error adding sample notifications:', error);
  }
}

function getNotificationIcon(type) {
  const iconMap = {
    'device_status_change': '📱',
    'new_customer': '👤',
    'payment_received': '💰',
    'inventory_low': '📦',
    'system_alert': '⚠️',
    'appointment_reminder': '📅',
    'diagnostic_complete': '🔍',
    'repair_complete': '✅',
    'customer_feedback': '💬',
    'whatsapp_message': '📱',
    'backup_complete': '💾',
    'security_alert': '🔒',
    'goal_achieved': '🎯',
    'overdue_device': '⏰',
    'new_remark': '💭',
    'loyalty_points': '⭐',
    'bulk_sms_sent': '📨',
    'export_complete': '📊'
  };
  return iconMap[type] || '🔔';
}

function getNotificationColor(priority) {
  const colorMap = {
    'low': 'text-gray-500 bg-gray-50',
    'normal': 'text-blue-600 bg-blue-50',
    'high': 'text-orange-600 bg-orange-50',
    'urgent': 'text-red-600 bg-red-50'
  };
  return colorMap[priority] || colorMap.normal;
}

// Run the script
addSampleNotifications();
