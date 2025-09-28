// Debug script for customer creation issues
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerCreation() {
  console.log('🔍 Testing customer creation...');
  
  // Test minimal customer data
  const testCustomer = {
    id: crypto.randomUUID(),
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+255123456789',
    gender: 'other',
    city: 'Dar es Salaam',
    joinedDate: new Date().toISOString(),
    loyaltyLevel: 'bronze',
    colorTag: 'new',
    totalSpent: 0,
    points: 0,
    lastVisit: new Date().toISOString(),
    isActive: true,
    notes: [],
    promoHistory: [],
    payments: [],
    devices: [],
    referrals: []
  };

  console.log('📝 Test customer data:', JSON.stringify(testCustomer, null, 2));

  // Map camelCase fields to snake_case database fields
  const fieldMapping = {
    colorTag: 'color_tag',
    isActive: 'is_active',
    lastVisit: 'last_visit',
    joinedDate: 'created_at',
    loyaltyLevel: 'loyalty_level',
    totalSpent: 'total_spent'
  };
  
  // Map customer fields to database fields
  const dbCustomer = {};
  Object.entries(testCustomer).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const dbFieldName = fieldMapping[key] || key;
      dbCustomer[dbFieldName] = value;
    }
  });

  console.log('🗄️ Database customer data:', JSON.stringify(dbCustomer, null, 2));

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([dbCustomer])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating customer:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Customer created successfully:', data);
    }
  } catch (error) {
    console.error('❌ Exception during customer creation:', error);
  }
}

async function checkTableSchema() {
  console.log('🔍 Checking customers table schema...');
  
  try {
    // Try to get table info by querying with limit 0
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('❌ Error checking table schema:', error);
    } else {
      console.log('✅ Table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Exception checking table:', error);
  }
}

async function main() {
  console.log('🚀 Starting customer creation debug...');
  
  await checkTableSchema();
  await testCustomerCreation();
  
  console.log('🏁 Debug complete');
}

main().catch(console.error);
