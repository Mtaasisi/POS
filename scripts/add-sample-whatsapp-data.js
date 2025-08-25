#!/usr/bin/env node

/**
 * Add Sample WhatsApp Data Script
 * Adds sample data for testing WhatsApp messaging functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleData() {
  console.log('📝 Adding Sample WhatsApp Data...\n');

  try {
    // Add sample WhatsApp instances
    console.log('📱 Adding sample WhatsApp instances...');
    const sampleInstances = [
      {
        instance_id: 'test-instance-1',
        phone_number: '+1234567890',
        status: 'connected',
        is_green_api: true,
        green_api_host: 'https://api.green-api.com',
        webhook_url: 'https://example.com/webhook',
        webhook_secret: 'test-secret-123'
      },
      {
        instance_id: 'test-instance-2',
        phone_number: '+0987654321',
        status: 'disconnected',
        is_green_api: true,
        green_api_host: 'https://api.green-api.com'
      }
    ];

    for (const instance of sampleInstances) {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert(instance)
        .select()
        .single();

      if (error) {
        console.log(`  ❌ Error adding instance ${instance.phone_number}: ${error.message}`);
      } else {
        console.log(`  ✅ Added instance: ${instance.phone_number} (${instance.status})`);
      }
    }

    // Add sample message templates
    console.log('\n📝 Adding sample message templates...');
    const sampleTemplates = [
      {
        name: 'Welcome Message',
        template_text: 'Welcome to our service! Thank you for contacting us. How can we help you today?',
        category: 'greeting',
        is_active: true
      },
      {
        name: 'Support Response',
        template_text: 'Thank you for your inquiry. Our support team will get back to you within 24 hours.',
        category: 'support',
        is_active: true
      },
      {
        name: 'Order Confirmation',
        template_text: 'Your order has been confirmed! Order #{{order_id}}. We\'ll notify you when it ships.',
        category: 'pos',
        is_active: true
      },
      {
        name: 'Appointment Reminder',
        template_text: 'Reminder: You have an appointment tomorrow at {{time}}. Please confirm your attendance.',
        category: 'appointment',
        is_active: true
      },
      {
        name: 'Promotional Offer',
        template_text: '🎉 Special offer! Get 20% off on your next purchase. Use code: SAVE20',
        category: 'marketing',
        is_active: true
      }
    ];

    for (const template of sampleTemplates) {
      const { data, error } = await supabase
        .from('green_api_message_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        console.log(`  ❌ Error adding template ${template.name}: ${error.message}`);
      } else {
        console.log(`  ✅ Added template: ${template.name} (${template.category})`);
      }
    }

    // Add sample messages to queue
    console.log('\n📨 Adding sample messages to queue...');
    const sampleMessages = [
      {
        instance_id: 'test-instance-1',
        chat_id: '+1234567890',
        message_type: 'text',
        content: 'Hello! This is a test message.',
        status: 'sent',
        sent_at: new Date().toISOString()
      },
      {
        instance_id: 'test-instance-1',
        chat_id: '+1234567890',
        message_type: 'text',
        content: 'Another test message for delivery tracking.',
        status: 'delivered',
        sent_at: new Date(Date.now() - 60000).toISOString(),
        delivered_at: new Date().toISOString()
      },
      {
        instance_id: 'test-instance-1',
        chat_id: '+1234567890',
        message_type: 'text',
        content: 'This message failed to send.',
        status: 'failed',
        error_message: 'Network timeout'
      }
    ];

    for (const message of sampleMessages) {
      const { data, error } = await supabase
        .from('green_api_message_queue')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.log(`  ❌ Error adding message: ${error.message}`);
      } else {
        console.log(`  ✅ Added message: ${message.content.substring(0, 30)}... (${message.status})`);
      }
    }

    // Add sample bulk campaigns
    console.log('\n🎯 Adding sample bulk campaigns...');
    const sampleCampaigns = [
      {
        name: 'Welcome Campaign',
        description: 'Welcome new customers',
        instance_id: 'test-instance-1',
        message_content: 'Welcome to our service! We\'re excited to have you on board.',
        status: 'completed',
        total_recipients: 100,
        sent_count: 95,
        delivered_count: 90,
        failed_count: 5,
        started_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: new Date(Date.now() - 82800000).toISOString()
      },
      {
        name: 'Promotional Campaign',
        description: 'Special offers for existing customers',
        instance_id: 'test-instance-1',
        message_content: '🎉 Special offer! Get 20% off on your next purchase. Use code: SAVE20',
        status: 'sending',
        total_recipients: 50,
        sent_count: 25,
        delivered_count: 20,
        failed_count: 5,
        started_at: new Date().toISOString()
      }
    ];

    for (const campaign of sampleCampaigns) {
      const { data, error } = await supabase
        .from('green_api_bulk_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) {
        console.log(`  ❌ Error adding campaign ${campaign.name}: ${error.message}`);
      } else {
        console.log(`  ✅ Added campaign: ${campaign.name} (${campaign.status})`);
      }
    }

    console.log('\n✅ Sample data added successfully!');
    
    // Verify the data was added
    console.log('\n📊 Verification:');
    
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('count');
    console.log(`  - Instances: ${instances?.length || 0}`);
    
    const { data: templates } = await supabase
      .from('green_api_message_templates')
      .select('count');
    console.log(`  - Templates: ${templates?.length || 0}`);
    
    const { data: messages } = await supabase
      .from('green_api_message_queue')
      .select('count');
    console.log(`  - Messages: ${messages?.length || 0}`);
    
    const { data: campaigns } = await supabase
      .from('green_api_bulk_campaigns')
      .select('count');
    console.log(`  - Campaigns: ${campaigns?.length || 0}`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

// Run the script
addSampleData()
  .then(() => {
    console.log('\n🎉 Sample data creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sample data creation failed:', error);
    process.exit(1);
  });
