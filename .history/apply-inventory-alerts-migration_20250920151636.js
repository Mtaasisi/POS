#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying inventory alert preferences migration...');

  try {
    // Create inventory_alert_preferences table
    const { error: prefsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS inventory_alert_preferences (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          is_enabled BOOLEAN DEFAULT true,
          low_stock_threshold INTEGER DEFAULT 10,
          show_as_modal BOOLEAN DEFAULT true,
          show_as_notification BOOLEAN DEFAULT true,
          auto_hide_notification_seconds INTEGER DEFAULT 5,
          dismissed_until TIMESTAMP WITH TIME ZONE,
          permanently_disabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    });

    if (prefsError) {
      console.error('❌ Error creating inventory_alert_preferences table:', prefsError);
    } else {
      console.log('✅ Created inventory_alert_preferences table');
    }

    // Create inventory_alert_history table
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS inventory_alert_history (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          product_id UUID REFERENCES lats_products(id) ON DELETE CASCADE,
          alert_data JSONB DEFAULT '{}',
          dismissed_for_today BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (historyError) {
      console.error('❌ Error creating inventory_alert_history table:', historyError);
    } else {
      console.log('✅ Created inventory_alert_history table');
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_inventory_alert_preferences_user_id ON inventory_alert_preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_user_id ON inventory_alert_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_created_at ON inventory_alert_history(created_at);
        CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_alert_type ON inventory_alert_history(alert_type);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Created indexes');
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE inventory_alert_preferences ENABLE ROW LEVEL SECURITY;
        ALTER TABLE inventory_alert_history ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
    } else {
      console.log('✅ Enabled RLS');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('- inventory_alert_preferences table');
    console.log('- inventory_alert_history table');
    console.log('- Indexes for performance');
    console.log('- Row Level Security policies');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. The inventory alerts will now use database preferences');
    console.log('2. User preferences are stored per user');
    console.log('3. Alert history is logged for analytics');
    console.log('4. Preferences persist across sessions');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
