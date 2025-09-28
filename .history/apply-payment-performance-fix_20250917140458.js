const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use the credentials from the scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaymentPerformanceFix() {
  try {
    console.log('🚀 Starting payment performance function fix...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'fix-missing-payment-performance-function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file read successfully');
    
    // First, let's check if the function already exists
    console.log('🔍 Checking if record_payment_performance function exists...');
    
    try {
      // Try to call the function to see if it exists
      const { data, error } = await supabase.rpc('record_payment_performance', {
        provider_name_param: 'test',
        transaction_id_param: null,
        transaction_type_param: 'test',
        amount_param: 0,
        currency_param: 'TZS',
        status_param: 'test',
        response_time_ms_param: null,
        error_message_param: null
      });
      
      if (!error) {
        console.log('✅ record_payment_performance function already exists!');
        return;
      }
    } catch (err) {
      console.log('⚠️ Function does not exist, proceeding with creation...');
    }
    
    // Check if payment_providers table exists
    console.log('🔍 Checking if payment_providers table exists...');
    const { error: providersError } = await supabase
      .from('payment_providers')
      .select('id')
      .limit(1);
    
    if (providersError && providersError.message.includes('does not exist')) {
      console.log('📋 payment_providers table does not exist, creating it...');
      
      // Create payment_providers table
      const createProvidersTable = `
        CREATE TABLE IF NOT EXISTS payment_providers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            type VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            provider_code VARCHAR(20) UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // Insert default providers
      const insertProviders = `
        INSERT INTO payment_providers (name, type, provider_code, description) VALUES
        ('Cash', 'cash', 'CASH', 'Physical cash payments'),
        ('Card', 'card', 'CARD', 'Credit/Debit card payments'),
        ('M-Pesa', 'mobile_money', 'MPESA', 'M-Pesa mobile money payments'),
        ('CRDB', 'bank_transfer', 'CRDB', 'CRDB Bank transfer payments')
        ON CONFLICT (name) DO NOTHING;
      `;
      
      console.log('⚠️ Manual table creation required');
      console.log('🔧 Please run this SQL in your Supabase dashboard:');
      console.log(createProvidersTable);
      console.log(insertProviders);
    } else {
      console.log('✅ payment_providers table exists');
    }
    
    // Check if payment_performance_metrics table exists
    console.log('🔍 Checking if payment_performance_metrics table exists...');
    const { error: metricsError } = await supabase
      .from('payment_performance_metrics')
      .select('id')
      .limit(1);
    
    if (metricsError && metricsError.message.includes('does not exist')) {
      console.log('📋 payment_performance_metrics table does not exist, creating it...');
      
      const createMetricsTable = `
        CREATE TABLE IF NOT EXISTS payment_performance_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id UUID NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
            transaction_id UUID,
            transaction_type VARCHAR(50) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'TZS',
            status VARCHAR(20) NOT NULL,
            response_time_ms INTEGER,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      console.log('⚠️ Manual table creation required');
      console.log('🔧 Please run this SQL in your Supabase dashboard:');
      console.log(createMetricsTable);
    } else {
      console.log('✅ payment_performance_metrics table exists');
    }
    
    // Create the function
    console.log('🔧 Creating record_payment_performance function...');
    
    const createFunction = `
      CREATE OR REPLACE FUNCTION record_payment_performance(
          provider_name_param VARCHAR(100),
          transaction_id_param UUID,
          transaction_type_param VARCHAR(50),
          amount_param DECIMAL(15,2),
          currency_param VARCHAR(3),
          status_param VARCHAR(20),
          response_time_ms_param INTEGER DEFAULT NULL,
          error_message_param TEXT DEFAULT NULL
      ) RETURNS BOOLEAN AS $$
      DECLARE
          provider_id_val UUID;
      BEGIN
          -- Get provider ID
          SELECT id INTO provider_id_val
          FROM payment_providers 
          WHERE name = provider_name_param;
          
          IF NOT FOUND THEN
              -- Create provider if it doesn't exist
              INSERT INTO payment_providers (name, type, provider_code)
              VALUES (provider_name_param, 'unknown', UPPER(provider_name_param))
              RETURNING id INTO provider_id_val;
          END IF;
          
          -- Insert performance metric
          INSERT INTO payment_performance_metrics (
              provider_id,
              transaction_id,
              transaction_type,
              amount,
              currency,
              status,
              response_time_ms,
              error_message
          ) VALUES (
              provider_id_val,
              transaction_id_param,
              transaction_type_param,
              amount_param,
              currency_param,
              status_param,
              response_time_ms_param,
              error_message_param
          );
          
          RETURN TRUE;
          
      EXCEPTION
          WHEN OTHERS THEN
              RAISE EXCEPTION 'Failed to record payment performance: %', SQLERRM;
              RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('⚠️ Manual function creation required');
    console.log('🔧 Please run this SQL in your Supabase dashboard:');
    console.log(createFunction);
    
    // Test the function after creation
    console.log('🧪 Testing the function...');
    console.log('📝 After running the SQL above, test with:');
    console.log('SELECT record_payment_performance(\'Cash\', NULL, \'test\', 100, \'TZS\', \'success\', 50, NULL);');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
applyPaymentPerformanceFix();
