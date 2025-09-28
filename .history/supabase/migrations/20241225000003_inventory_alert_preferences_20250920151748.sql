-- Create inventory_alert_preferences table
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

-- Create inventory_alert_history table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_alert_preferences_user_id ON inventory_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_user_id ON inventory_alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_created_at ON inventory_alert_history(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_alert_type ON inventory_alert_history(alert_type);

-- Enable RLS
ALTER TABLE inventory_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alert_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_alert_preferences
CREATE POLICY "Users can view their own inventory alert preferences" ON inventory_alert_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory alert preferences" ON inventory_alert_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory alert preferences" ON inventory_alert_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory alert preferences" ON inventory_alert_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for inventory_alert_history
CREATE POLICY "Users can view their own inventory alert history" ON inventory_alert_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory alert history" ON inventory_alert_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory alert history" ON inventory_alert_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory alert history" ON inventory_alert_history
    FOR DELETE USING (auth.uid() = user_id);
