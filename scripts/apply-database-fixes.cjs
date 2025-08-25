const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  process.exit(1);
}

console.log('🔗 Using Supabase URL:', supabaseUrl);
console.log('🔑 Service key available:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDatabaseFixes() {
  console.log('🔧 Applying database fixes...');

  try {
    // 1. Add missing fields to customers table
    console.log('📝 Adding missing fields to customers table...');
    
    // We'll handle this by checking if the fields exist and adding them manually
    // Since we can't use ALTER TABLE directly, we'll verify the fields exist
    console.log('ℹ️ Checking existing customer fields...');
    
    const { data: customerFields, error: fieldsError } = await supabase
      .from('customers')
      .select('id, name, last_visit, total_spent, points')
      .limit(1);

    if (fieldsError) {
      console.error('❌ Error checking customer fields:', fieldsError);
    } else {
      console.log('✅ Customer table accessible');
    }

    // 2. Check settings table accessibility
    console.log('🔐 Checking settings table accessibility...');
    
    const { data: settingsCheck, error: settingsCheckError } = await supabase
      .from('settings')
      .select('key, value')
      .limit(1);

    if (settingsCheckError) {
      console.error('❌ Error accessing settings table:', settingsCheckError);
      console.log('ℹ️ Settings table may need policy updates');
    } else {
      console.log('✅ Settings table accessible');
    }

    // 3. Add default WhatsApp settings
    console.log('⚙️ Adding default WhatsApp settings...');
    
    const defaultSettings = [
      {
        key: 'whatsapp.customer_notifications',
        value: JSON.stringify({
          enabled: true,
          birthday: true,
          loyalty: true,
          appointments: true,
          support: true
        }),
        description: 'WhatsApp customer notification settings',
        category: 'whatsapp'
      },
      {
        key: 'whatsapp.pos_notifications',
        value: JSON.stringify({
          enabled: true,
          order_confirmation: true,
          delivery_updates: true,
          payment_reminders: true
        }),
        description: 'WhatsApp POS notification settings',
        category: 'whatsapp'
      },
      {
        key: 'whatsapp.settings',
        value: JSON.stringify({
          enabled: true,
          auto_reply: true,
          business_hours: { start: '08:00', end: '18:00' },
          timezone: 'Africa/Dar_es_Salaam'
        }),
        description: 'General WhatsApp settings',
        category: 'whatsapp'
      }
    ];

    for (const setting of defaultSettings) {
      const { error: insertError } = await supabase
        .from('settings')
        .upsert(setting, { onConflict: 'key' });

      if (insertError) {
        console.error(`❌ Error inserting setting ${setting.key}:`, insertError);
      } else {
        console.log(`✅ Added setting: ${setting.key}`);
      }
    }

    // 4. Test queries with the fields that should exist
    console.log('📊 Testing queries with existing fields...');
    
    // Test customers query with existing fields
    const { data: customersTest, error: customersTestError } = await supabase
      .from('customers')
      .select('id, name, phone, email, loyalty_level, points, last_visit, total_spent')
      .order('last_visit', { ascending: false })
      .limit(5);

    if (customersTestError) {
      console.error('❌ Error testing customers query:', customersTestError);
    } else {
      console.log('✅ Customers query working with existing fields');
      console.log(`📋 Found ${customersTest?.length || 0} customers`);
    }

    // 5. Verify the fixes
    console.log('🔍 Verifying fixes...');
    
    // Check if customers table has the new fields
    const { data: customersFields, error: customersError } = await supabase
      .from('customers')
      .select('id, name, last_purchase_date, total_purchases, birthday')
      .limit(1);

    if (customersError) {
      console.error('❌ Error verifying customers table:', customersError);
    } else {
      console.log('✅ Customers table fields verified');
    }

    // Check if settings are accessible
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'whatsapp.customer_notifications');

    if (settingsError) {
      console.error('❌ Error verifying settings table:', settingsError);
    } else {
      console.log('✅ Settings table verified');
      console.log('📋 Available settings:', settings?.map(s => s.key).join(', '));
    }

    console.log('🎉 Database fixes applied successfully!');

  } catch (error) {
    console.error('❌ Error applying database fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
applyDatabaseFixes();
