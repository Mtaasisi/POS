import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWhatsAppSettingsTable() {
  try {
    console.log('🔍 Checking WhatsApp settings table...');
    
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('whatsapp_hub_settings')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
        console.log('❌ Table "whatsapp_hub_settings" does not exist');
        console.log('📋 You need to run the database migration');
        console.log('🔧 Run this SQL in your Supabase SQL editor:');
        console.log('');
        console.log('-- Create WhatsApp Hub Settings Table');
        console.log('CREATE TABLE IF NOT EXISTS whatsapp_hub_settings (');
        console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,');
        console.log('    auto_refresh_interval INTEGER DEFAULT 30 CHECK (auto_refresh_interval >= 10 AND auto_refresh_interval <= 3600),');
        console.log('    default_message_type VARCHAR(20) DEFAULT \'text\' CHECK (default_message_type IN (\'text\', \'image\', \'document\', \'location\', \'contact\')),');
        console.log('    enable_notifications BOOLEAN DEFAULT true,');
        console.log('    enable_sound_alerts BOOLEAN DEFAULT false,');
        console.log('    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 1 AND max_retries <= 10),');
        console.log('    message_delay INTEGER DEFAULT 1000 CHECK (message_delay >= 500 AND message_delay <= 10000),');
        console.log('    enable_webhooks BOOLEAN DEFAULT true,');
        console.log('    enable_analytics BOOLEAN DEFAULT true,');
        console.log('    enable_bulk_messaging BOOLEAN DEFAULT true,');
        console.log('    enable_template_management BOOLEAN DEFAULT true,');
        console.log('    green_api_instance_id VARCHAR(255),');
        console.log('    green_api_token VARCHAR(255),');
        console.log('    green_api_url VARCHAR(255) DEFAULT \'https://api.green-api.com\',');
        console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('    UNIQUE(user_id)');
        console.log(');');
        console.log('');
        console.log('-- Enable RLS');
        console.log('ALTER TABLE whatsapp_hub_settings ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('-- Create policies');
        console.log('CREATE POLICY "Users can view their own settings" ON whatsapp_hub_settings FOR SELECT USING (auth.uid() = user_id);');
        console.log('CREATE POLICY "Users can insert their own settings" ON whatsapp_hub_settings FOR INSERT WITH CHECK (auth.uid() = user_id);');
        console.log('CREATE POLICY "Users can update their own settings" ON whatsapp_hub_settings FOR UPDATE USING (auth.uid() = user_id);');
        console.log('CREATE POLICY "Users can delete their own settings" ON whatsapp_hub_settings FOR DELETE USING (auth.uid() = user_id);');
      } else {
        console.log('❌ Error checking table:', error);
      }
      return;
    }
    
    console.log('✅ Table "whatsapp_hub_settings" exists');
    
    // Check table structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'whatsapp_hub_settings' });
    
    if (columnsError) {
      console.log('⚠️ Could not check table structure:', columnsError.message);
    } else {
      console.log('📋 Table columns:', columns);
    }
    
    // Check if there are any settings records
    const { count, error: countError } = await supabase
      .from('whatsapp_hub_settings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('⚠️ Could not count records:', countError.message);
    } else {
      console.log(`📊 Found ${count} settings records`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWhatsAppSettingsTable();
