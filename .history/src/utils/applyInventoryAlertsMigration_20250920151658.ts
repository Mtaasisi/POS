import { supabase } from '../lib/supabaseClient';

export const applyInventoryAlertsMigration = async () => {
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
      return false;
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
      return false;
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
      return false;
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
      return false;
    } else {
      console.log('✅ Enabled RLS');
    }

    console.log('🎉 Migration completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};
