import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWhatsAppOptOut() {
  console.log('🔧 Fixing WhatsApp opt-out column issue...\n');

  try {
    console.log('📋 Attempting to add whatsapp_opt_out column...');

    // Try to add the column directly using RPC call
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_out ON customers(whatsapp_opt_out);
        COMMENT ON COLUMN customers.whatsapp_opt_out IS 'Whether the customer has opted out of WhatsApp messages';
      `
    });

    if (addError) {
      console.error('❌ Error adding column:', addError);
      
      // Test if we can access the customers table at all
      console.log('🔄 Testing database connection...');
      
      const { data, error: testError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection issue:', testError);
        console.log('\n📋 Manual fix required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run this SQL:');
        console.log(`
          ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;
          CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_out ON customers(whatsapp_opt_out);
          COMMENT ON COLUMN customers.whatsapp_opt_out IS 'Whether the customer has opted out of WhatsApp messages';
        `);
      } else {
        console.log('✅ Database connection works, but RPC function not available');
        console.log('📋 Please run the SQL manually in your Supabase dashboard');
      }
    } else {
      console.log('✅ whatsapp_opt_out column added successfully!');
      
      // Test the column by trying to query it
      const { data, error: testError } = await supabase
        .from('customers')
        .select('whatsapp_opt_out')
        .limit(1);
      
      if (testError) {
        console.warn('⚠️ Column added but query test failed:', testError);
      } else {
        console.log('✅ Column query test successful!');
      }
    }

  } catch (error) {
    console.error('❌ Error fixing WhatsApp opt-out:', error);
    console.log('\n📋 Manual fix required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL:');
    console.log(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;
      CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_out ON customers(whatsapp_opt_out);
      COMMENT ON COLUMN customers.whatsapp_opt_out IS 'Whether the customer has opted out of WhatsApp messages';
    `);
  }
}

// Run the fix
fixWhatsAppOptOut().catch(console.error);
