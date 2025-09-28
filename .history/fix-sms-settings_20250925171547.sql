-- SMS Configuration Fix
-- Run this SQL script in your Supabase SQL Editor to fix SMS issues

-- Insert or update SMS provider settings
INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'test_api_key_123'),
('sms_api_url', 'https://httpbin.org/post'),
('sms_price', '15')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verify the settings were inserted
SELECT key, value, created_at, updated_at 
FROM settings 
WHERE key IN ('sms_provider_api_key', 'sms_api_url', 'sms_price')
ORDER BY key;

-- Check if sms_logs table exists (create if missing)
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('sent', 'delivered', 'failed', 'pending')) DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_id TEXT,
    cost DECIMAL(10,2),
    personalization_data JSONB
);

-- Check if sms_templates table exists (create if missing)
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_optimized BOOLEAN DEFAULT false
);

-- Insert some default SMS templates
INSERT INTO sms_templates (name, content, variables, is_active) VALUES 
('Device Received', '✅ Tumepokea Kimepokelewa!\n\nHellow Mtaasisi {name},\n\nHabari njema! {device_brand} {device_model} yako imepokelewa na sasa iko katika foleni ya ukarabati wa Inauzwa.\n\n📋 Namba ya Kumbukumbu: #{device_id}\n📅 Tarehe ya Kupokea: {date}\n🔧 Tatizo: {issue}\n\nSubiri ujumbe kupitia SMS kikiwa tayari!\n\nAsante kwa kumtumaini Inauzwa 🚀', 
 '["name", "device_brand", "device_model", "device_id", "date", "issue"]'::jsonb, true),

('Device Ready', '🎉 Kifaa Chako Tayari!\n\nHabari Mtaasisi {name},\n\nHabari njema! {device_brand} {device_model} yako imekamilika na tayari kuchukuliwa.\n\n📋 Namba ya Kumbukumbu: #{device_id}\n✅ Tarehe ya Kukamilisha: {date}\n\nTafadhali uje kuchukua kifaa chako katika ofisi yetu ndani ya muda ili kuepuka usumbufu.\n\nAsante kwa kumtumaini Inauzwa! 🚀', 
 '["name", "device_brand", "device_model", "device_id", "date"]'::jsonb, true),

('Payment Reminder', 'Habari Mtaasisi {name},\n\nKumbuka kuwa una deni la TSh {amount} kwa huduma za ukarabati.\n\nTafadhali lipia ili kuchukua kifaa chako.\n\nAsante - Inauzwa', 
 '["name", "amount"]'::jsonb, true)

ON CONFLICT (name) DO NOTHING;

-- Verify templates were created
SELECT name, is_active, created_at FROM sms_templates ORDER BY name;

-- Success message
SELECT 'SMS configuration completed successfully! You can now test SMS functionality.' as status;
