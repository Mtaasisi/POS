import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function debugTableAccess() {
  try {
    console.log('🔍 Debugging table access...');
    console.log('');

    // Test with service key (should have full access)
    console.log('1. Testing with SERVICE KEY (full access):');
    
    const { data: messagesService, error: messagesServiceError } = await supabaseService
      .from('purchase_order_messages')
      .select('id')
      .limit(1);
    
    if (messagesServiceError) {
      console.log('❌ purchase_order_messages (service):', messagesServiceError.message, messagesServiceError.code);
    } else {
      console.log('✅ purchase_order_messages (service): Accessible');
    }

    const { data: paymentsService, error: paymentsServiceError } = await supabaseService
      .from('purchase_order_payments')
      .select('id')
      .limit(1);
    
    if (paymentsServiceError) {
      console.log('❌ purchase_order_payments (service):', paymentsServiceError.message, paymentsServiceError.code);
    } else {
      console.log('✅ purchase_order_payments (service): Accessible');
    }

    console.log('');

    // Test with anon key (user access)
    console.log('2. Testing with ANON KEY (user access):');
    
    const { data: messagesAnon, error: messagesAnonError } = await supabaseAnon
      .from('purchase_order_messages')
      .select('id')
      .limit(1);
    
    if (messagesAnonError) {
      console.log('❌ purchase_order_messages (anon):', messagesAnonError.message, messagesAnonError.code);
    } else {
      console.log('✅ purchase_order_messages (anon): Accessible');
    }

    const { data: paymentsAnon, error: paymentsAnonError } = await supabaseAnon
      .from('purchase_order_payments')
      .select('id')
      .limit(1);
    
    if (paymentsAnonError) {
      console.log('❌ purchase_order_payments (anon):', paymentsAnonError.message, paymentsAnonError.code);
    } else {
      console.log('✅ purchase_order_payments (anon): Accessible');
    }

    console.log('');

    // Test table existence by querying information_schema
    console.log('3. Checking table existence in information_schema:');
    
    const { data: tableInfo, error: tableInfoError } = await supabaseService
      .rpc('exec_sql', {
        query: `
          SELECT table_name, table_type 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('purchase_order_messages', 'purchase_order_payments')
          ORDER BY table_name;
        `
      });

    if (tableInfoError) {
      console.log('❌ Error checking table info:', tableInfoError.message);
    } else {
      console.log('📋 Tables found:', tableInfo);
    }

    console.log('');

    // Test RLS policies
    console.log('4. Checking RLS status:');
    
    const { data: rlsInfo, error: rlsError } = await supabaseService
      .rpc('exec_sql', {
        query: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE tablename IN ('purchase_order_messages', 'purchase_order_payments')
          ORDER BY tablename;
        `
      });

    if (rlsError) {
      console.log('❌ Error checking RLS info:', rlsError.message);
    } else {
      console.log('🔒 RLS Status:', rlsInfo);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug script
debugTableAccess();
