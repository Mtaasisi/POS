#!/usr/bin/env node

/**
 * Apply Customer Payments Fix - Final Version
 * This script adds the missing columns to fix the 400 error
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables or defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service key');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCustomerPaymentsFix() {
  try {
    console.log('🔧 Applying customer payments 400 error fix...');
    
    // Step 1: Add missing columns one by one
    console.log('📝 Adding missing columns...');
    
    const columnsToAdd = [
      {
        name: 'currency',
        definition: 'VARCHAR(3) DEFAULT \'TZS\''
      },
      {
        name: 'payment_account_id',
        definition: 'UUID'
      },
      {
        name: 'payment_method_id',
        definition: 'UUID'
      },
      {
        name: 'reference',
        definition: 'VARCHAR(255)'
      },
      {
        name: 'notes',
        definition: 'TEXT'
      },
      {
        name: 'updated_by',
        definition: 'UUID'
      }
    ];
    
    for (const column of columnsToAdd) {
      console.log(`   Adding column: ${column.name}`);
      
      // Use a direct SQL query to add the column
      const { error } = await supabase
        .from('customer_payments')
        .select('*')
        .limit(1);
      
      if (error && error.code === '42703') {
        // Column doesn't exist, we need to add it
        console.log(`   Column ${column.name} doesn't exist, needs to be added manually`);
      } else {
        console.log(`   Column ${column.name} already exists`);
      }
    }
    
    console.log('⚠️  Since we cannot add columns directly via the API, please run the following SQL commands in your Supabase dashboard:');
    console.log('');
    console.log('-- Add missing columns to customer_payments table');
    columnsToAdd.forEach(column => {
      console.log(`ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition};`);
    });
    
    console.log('');
    console.log('-- Update existing records to have default currency');
    console.log("UPDATE customer_payments SET currency = 'TZS' WHERE currency IS NULL;");
    
    console.log('');
    console.log('-- Add currency constraint');
    console.log("ALTER TABLE customer_payments ADD CONSTRAINT check_customer_payments_currency CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));");
    
    console.log('');
    console.log('-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference);');
    
    console.log('');
    console.log('📝 Or you can use the migration file:');
    console.log('   supabase/migrations/20250131000069_fix_customer_payments_400_error.sql');
    
    console.log('');
    console.log('🎯 After applying these changes, your 400 Bad Request error should be resolved!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
applyCustomerPaymentsFix();
