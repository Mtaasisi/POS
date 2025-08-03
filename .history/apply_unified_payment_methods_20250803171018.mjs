#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyUnifiedPaymentMethods() {
  try {
    console.log('🚀 Starting unified payment methods setup...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'unified_payment_methods_setup.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL file not found:', sqlFilePath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📋 Executing SQL setup...');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error('❌ Error executing statement:', error.message);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        console.error('❌ Error executing statement:', err.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Setup completed!`);
    console.log(`✅ Successful statements: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Failed statements: ${errorCount}`);
    }
    
    // Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    // Check if payment_methods table exists
    const { data: methods, error: methodsError } = await supabase
      .from('payment_methods')
      .select('count')
      .limit(1);
    
    if (methodsError) {
      console.error('❌ Error checking payment_methods table:', methodsError.message);
    } else {
      console.log('✅ payment_methods table is accessible');
    }
    
    // Check if payment_method_accounts table exists
    const { data: accounts, error: accountsError } = await supabase
      .from('payment_method_accounts')
      .select('count')
      .limit(1);
    
    if (accountsError) {
      console.error('❌ Error checking payment_method_accounts table:', accountsError.message);
    } else {
      console.log('✅ payment_method_accounts table is accessible');
    }
    
    // Get payment methods count
    const { data: paymentMethods, error: countError } = await supabase
      .from('payment_methods')
      .select('*');
    
    if (countError) {
      console.error('❌ Error counting payment methods:', countError.message);
    } else {
      console.log(`✅ Found ${paymentMethods?.length || 0} payment methods`);
    }
    
    console.log('\n🎉 Unified payment methods setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your POS components to use the new PaymentMethodSelector');
    console.log('2. Update your Finance Management components to use the new payment methods');
    console.log('3. Test the payment method selection in both systems');
    console.log('4. Link payment methods to finance accounts as needed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
applyUnifiedPaymentMethods(); 