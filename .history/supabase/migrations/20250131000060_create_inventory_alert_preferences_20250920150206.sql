-- Create Inventory Alert Preferences Table
-- Migration: 20250131000060_create_inventory_alert_preferences.sql
-- This migration creates a table to store user-specific inventory alert preferences

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- INVENTORY ALERT PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_alert_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert Settings
    low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 1 AND low_stock_threshold <= 1000),
    enable_low_stock_alerts BOOLEAN DEFAULT true,
    enable_out_of_stock_alerts BOOLEAN DEFAULT true,
    enable_price_change_alerts BOOLEAN DEFAULT false,
    enable_new_arrival_alerts BOOLEAN DEFAULT false,
    
    -- Display Preferences
    show_alerts_as_modal BOOLEAN DEFAULT true,
    show_alerts_as_notification BOOLEAN DEFAULT true,
    auto_hide_notification_seconds INTEGER DEFAULT 5 CHECK (auto_hide_notification_seconds >= 3 AND auto_hide_notification_seconds <= 30),
    
    -- Dismissal Settings
    alerts_dismissed_until DATE,
    alerts_permanently_disabled BOOLEAN DEFAULT false,
    
    -- Notification Settings
    enable_sound_alerts BOOLEAN DEFAULT false,
    enable_email_alerts BOOLEAN DEFAULT false,
    enable_whatsapp_alerts BOOLEAN DEFAULT false,
    
    -- Advanced Settings
    alert_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (alert_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    group_similar_alerts BOOLEAN DEFAULT true,
    max_alerts_per_session INTEGER DEFAULT 5 CHECK (max_alerts_per_session >= 1 AND max_alerts_per_session <= 20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_alert_preferences_user_id ON inventory_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_preferences_dismissed_until ON inventory_alert_preferences(alerts_dismissed_until);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_preferences_updated_at ON inventory_alert_preferences(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE inventory_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own alert preferences" ON inventory_alert_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert preferences" ON inventory_alert_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert preferences" ON inventory_alert_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert preferences" ON inventory_alert_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_inventory_alert_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_alert_preferences_updated_at
    BEFORE UPDATE ON inventory_alert_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_alert_preferences_updated_at();

-- =====================================================
-- INVENTORY ALERT HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'price_change', 'new_arrival')),
    product_id UUID,
    product_name TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}',
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissed_until DATE,
    permanently_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alert history
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_user_id ON inventory_alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_alert_type ON inventory_alert_history(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_product_id ON inventory_alert_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_created_at ON inventory_alert_history(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_dismissed_until ON inventory_alert_history(dismissed_until);

-- Enable RLS for alert history
ALTER TABLE inventory_alert_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alert history
CREATE POLICY "Users can view their own alert history" ON inventory_alert_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert history" ON inventory_alert_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert history" ON inventory_alert_history
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INSERT DEFAULT PREFERENCES FOR EXISTING USERS
-- =====================================================
INSERT INTO inventory_alert_preferences (user_id, low_stock_threshold, enable_low_stock_alerts, show_alerts_as_modal, show_alerts_as_notification)
SELECT 
    id as user_id,
    10 as low_stock_threshold,
    true as enable_low_stock_alerts,
    true as show_alerts_as_modal,
    true as show_alerts_as_notification
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM inventory_alert_preferences)
ON CONFLICT (user_id) DO NOTHING;
