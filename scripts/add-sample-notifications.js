import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addSampleNotifications() {
  console.log('🔔 Adding sample notifications...');
  
  try {
    // Use a specific user ID (you can change this to match your user)
    const userId = '3f2d2ce5-243c-41c0-a162-248bd70b40bd'; // System Administrator
    
    console.log(`📝 Creating notifications for user ID: ${userId}`);

    // Sample notifications
    const sampleNotifications = [
      {
        user_id: userId,
        type: 'device_status_change',
        category: 'devices',
        title: 'Device Status Updated',
        message: 'Device iPhone 13 status has been updated to "In Progress"',
        priority: 'normal',
        status: 'unread',
        icon: '📱',
        color: 'text-blue-600 bg-blue-50',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        user_id: userId,
        type: 'new_customer',
        category: 'customers',
        title: 'New Customer Registered',
        message: 'A new customer John Doe has been registered',
        priority: 'normal',
        status: 'unread',
        icon: '👤',
        color: 'text-green-600 bg-green-50',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        user_id: userId,
        type: 'payment_received',
        category: 'payments',
        title: 'Payment Received',
        message: 'Payment of TZS 150,000 has been received for iPhone 13 repair',
        priority: 'normal',
        status: 'unread',
        icon: '💰',
        color: 'text-green-600 bg-green-50',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      },
      {
        user_id: userId,
        type: 'inventory_low',
        category: 'inventory',
        title: 'Low Inventory Alert',
        message: 'Item iPhone 13 Screen is running low on stock (Quantity: 3)',
        priority: 'high',
        status: 'unread',
        icon: '📦',
        color: 'text-orange-600 bg-orange-50',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
      },
      {
        user_id: userId,
        type: 'overdue_device',
        category: 'devices',
        title: 'Overdue Device',
        message: 'Device Samsung Galaxy S21 is overdue for pickup',
        priority: 'high',
        status: 'unread',
        icon: '⏰',
        color: 'text-orange-600 bg-orange-50',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      },
      {
        user_id: userId,
        type: 'repair_complete',
        category: 'devices',
        title: 'Repair Complete',
        message: 'Repair for MacBook Pro has been completed successfully',
        priority: 'normal',
        status: 'read',
        icon: '✅',
        color: 'text-green-600 bg-green-50',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: userId,
        type: 'whatsapp_message',
        category: 'communications',
        title: 'New WhatsApp Message',
        message: 'New message received from Jane Smith',
        priority: 'normal',
        status: 'unread',
        icon: '📱',
        color: 'text-green-600 bg-green-50',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        user_id: userId,
        type: 'system_alert',
        category: 'system',
        title: 'System Alert',
        message: 'Database backup has been completed successfully',
        priority: 'normal',
        status: 'unread',
        icon: '💾',
        color: 'text-green-600 bg-green-50',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      }
    ];

    // Insert notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .insert(sampleNotifications)
      .select();

    if (notificationsError) {
      console.error('❌ Error adding notifications:', notificationsError);
      console.log('💡 Try running this script with a valid user ID or check RLS policies');
      return;
    }

    console.log(`✅ Successfully added ${notifications?.length || 0} sample notifications`);
    
    // Create notification settings for the user
    const { error: settingsError } = await supabase
      .from('notification_settings')
      .insert({
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        whatsapp_notifications: true,
        device_notifications: true,
        customer_notifications: true,
        payment_notifications: true,
        inventory_notifications: true,
        system_notifications: true,
        appointment_notifications: true,
        diagnostic_notifications: true,
        loyalty_notifications: true,
        communication_notifications: true,
        backup_notifications: true,
        security_notifications: true,
        goal_notifications: true,
        low_priority_notifications: true,
        normal_priority_notifications: true,
        high_priority_notifications: true,
        urgent_priority_notifications: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'UTC',
        digest_enabled: false,
        digest_frequency: 'daily',
        digest_time: '09:00'
      })
      .single();

    if (settingsError && settingsError.code !== '23505') { // Ignore unique constraint violation
      console.error('❌ Error creating notification settings:', settingsError);
    } else {
      console.log('✅ Notification settings created');
    }

    console.log('\n🎉 Sample notifications added successfully!');
    console.log('📝 You can now test the notification system in the TopBar');
    console.log('💡 Make sure to update the userId in this script to match your actual user ID');

  } catch (error) {
    console.error('❌ Error adding sample notifications:', error);
  }
}

// Run the script
addSampleNotifications();
