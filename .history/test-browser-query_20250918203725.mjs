import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Missing Supabase anon key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBrowserQuery() {
  try {
    console.log('🧪 Testing browser-like query...');
    
    // Simulate the exact query from the browser
    const query = supabase
      .from('customer_payments')
      .select(`
        *,
        devices(brand, model),
        customers(name)
      `)
      .order('payment_date', { ascending: false });
    
    console.log('📋 Query object:', query);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Query error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Query successful, found', data.length, 'records');
    }
    
    // Test with a simpler query
    console.log('\\n🧪 Testing simpler query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (simpleError) {
      console.error('❌ Simple query error:', simpleError);
    } else {
      console.log('✅ Simple query successful, found', simpleData.length, 'records');
    }
    
    // Test the join separately
    console.log('\\n🧪 Testing customers join...');
    const { data: customerData, error: customerError } = await supabase
      .from('customer_payments')
      .select('*, customers(name)')
      .limit(1);
    
    if (customerError) {
      console.error('❌ Customer join error:', customerError);
    } else {
      console.log('✅ Customer join successful, found', customerData.length, 'records');
    }
    
    // Test devices join
    console.log('\\n🧪 Testing devices join...');
    const { data: deviceData, error: deviceError } = await supabase
      .from('customer_payments')
      .select('*, devices(brand, model)')
      .limit(1);
    
    if (deviceError) {
      console.error('❌ Device join error:', deviceError);
    } else {
      console.log('✅ Device join successful, found', deviceData.length, 'records');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testBrowserQuery();
