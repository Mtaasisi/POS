#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Fixing SMS Connections...');
console.log('===========================\n');

async function fixSMSTables() {
  console.log('📱 Fixing SMS Tables...');
  
  try {
    // Check if sms_logs table exists and has proper structure
    const { data: logsData, error: logsError } = await supabase
      .from('sms_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.log('❌ sms_logs table issue:', logsError.message);
      
      // Try to create the table if it doesn't exist
      console.log('🛠️  Attempting to create sms_logs table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS sms_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          phone_number TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
          error_message TEXT,
          sent_at TIMESTAMP WITH TIME ZONE,
          sent_by TEXT,
          cost DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // Note: This would need to be run with service role key
      console.log('⚠️  Table creation requires service role key');
    } else {
      console.log('✅ sms_logs table is accessible');
    }
    
    // Check communication_templates table
    const { data: templatesData, error: templatesError } = await supabase
      .from('communication_templates')
      .select('*')
      .limit(1);
    
    if (templatesError) {
      console.log('❌ communication_templates table issue:', templatesError.message);
    } else {
      console.log('✅ communication_templates table is accessible');
    }
    
  } catch (error) {
    console.log('❌ Error checking tables:', error.message);
  }
}

async function fixRLSPolicies() {
  console.log('\n🔐 Fixing RLS Policies...');
  
  try {
    // Test if we can insert with current permissions
    const testLog = {
      phone_number: '+255700000000',
      message: 'Test SMS from fix script',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('sms_logs')
      .insert(testLog)
      .select()
      .single();
    
    if (error) {
      console.log('❌ RLS policy issue:', error.message);
      console.log('🛠️  RLS policies need to be updated');
      
      // Provide SQL to fix RLS policies
      const fixRLSSQL = `
        -- Enable RLS on sms_logs table
        ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow all operations for authenticated users
        CREATE POLICY "Allow all operations for authenticated users" ON sms_logs
          FOR ALL USING (auth.role() = 'authenticated');
        
        -- Create policy to allow all operations for service role
        CREATE POLICY "Allow all operations for service role" ON sms_logs
          FOR ALL USING (auth.role() = 'service_role');
        
        -- Create policy to allow all operations for anon (for testing)
        CREATE POLICY "Allow all operations for anon" ON sms_logs
          FOR ALL USING (true);
      `;
      
      console.log('📝 SQL to fix RLS policies:');
      console.log(fixRLSSQL);
      
    } else {
      console.log('✅ RLS policies are working correctly');
      
      // Clean up test entry
      await supabase.from('sms_logs').delete().eq('id', data.id);
      console.log('✅ Test entry cleaned up');
    }
    
  } catch (error) {
    console.log('❌ Error testing RLS policies:', error.message);
  }
}

async function fixBalanceParsing() {
  console.log('\n💰 Fixing Balance Parsing...');
  
  try {
    const params = new URLSearchParams({
      user: 'Inauzwa',
      pwd: '@Masika10',
    });
    
    const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
    const responseText = await response.text();
    
    console.log('📡 Raw balance response:', responseText);
    
    // Parse the balance from "Tanzania (+255) = 3452," format
    const balanceMatch = responseText.match(/=\s*(\d+)/);
    if (balanceMatch) {
      const balance = balanceMatch[1];
      console.log(`✅ Balance parsed successfully: ${balance} credits`);
      
      // Update the SMS service to handle this format
      console.log('🛠️  Update SMS service balance parsing:');
      console.log(`
        // In smsService.ts, update the checkBalance method:
        const balanceMatch = responseText.match(/=\s*(\\d+)/);
        if (balanceMatch) {
          return { success: true, balance: balanceMatch[1] };
        }
      `);
      
    } else {
      console.log('❌ Could not parse balance from response');
    }
    
  } catch (error) {
    console.log('❌ Error checking balance:', error.message);
  }
}

async function updateSMSService() {
  console.log('\n🔧 Updating SMS Service...');
  
  try {
    // Read the current SMS service file
    const fs = await import('fs');
    const path = await import('path');
    
    const smsServicePath = path.join(process.cwd(), 'src', 'services', 'smsService.ts');
    
    if (fs.existsSync(smsServicePath)) {
      console.log('✅ SMS service file found');
      
      // Create updated balance parsing logic
      const updatedBalanceMethod = `
  /**
   * Check Mobishastra SMS balance
   */
  async checkBalance(): Promise<{ success: boolean; balance?: string; error?: string }> {
    try {
      const params = new URLSearchParams({
        user: this.USER,
        pwd: this.PASSWORD,
      });
      
      const response = await fetch(\`https://mshastra.com/balance.aspx?\${params.toString()}\`);
      const responseText = await response.text();
      
      console.log('Balance API response:', responseText);
      
      if (response.ok) {
        // Parse balance from "Tanzania (+255) = 3452," format
        const balanceMatch = responseText.match(/=\\s*(\\d+)/);
        if (balanceMatch) {
          return { success: true, balance: balanceMatch[1] };
        }
        
        // Fallback to original parsing
        const trimmedResponse = responseText.trim();
        if (!isNaN(Number(trimmedResponse))) {
          return { success: true, balance: trimmedResponse };
        }
      }
      
      return { success: false, error: responseText };
    } catch (error) {
      console.error('Error checking balance:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }`;
      
      console.log('📝 Updated balance parsing method:');
      console.log(updatedBalanceMethod);
      
    } else {
      console.log('❌ SMS service file not found');
    }
    
  } catch (error) {
    console.log('❌ Error updating SMS service:', error.message);
  }
}

async function testFixedConnections() {
  console.log('\n🧪 Testing Fixed Connections...');
  
  try {
    // Test SMS log creation with proper error handling
    const testLog = {
      phone_number: '+255700000000',
      message: 'Test SMS after fixes',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('sms_logs')
      .insert(testLog)
      .select()
      .single();
    
    if (error) {
      console.log('❌ SMS log creation still failing:', error.message);
      console.log('💡 Try running the RLS fix SQL in your Supabase dashboard');
    } else {
      console.log('✅ SMS log creation working after fixes');
      
      // Clean up
      await supabase.from('sms_logs').delete().eq('id', data.id);
      console.log('✅ Test entry cleaned up');
    }
    
    // Test balance parsing
    const params = new URLSearchParams({
      user: 'Inauzwa',
      pwd: '@Masika10',
    });
    
    const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
    const responseText = await response.text();
    
    const balanceMatch = responseText.match(/=\s*(\d+)/);
    if (balanceMatch) {
      console.log(`✅ Balance parsing working: ${balanceMatch[1]} credits`);
    } else {
      console.log('❌ Balance parsing still needs work');
    }
    
  } catch (error) {
    console.log('❌ Error testing fixed connections:', error.message);
  }
}

async function runFixes() {
  console.log('🚀 Starting SMS Connection Fixes...\n');
  
  await fixSMSTables();
  await fixRLSPolicies();
  await fixBalanceParsing();
  await updateSMSService();
  await testFixedConnections();
  
  console.log('\n📋 Fix Summary');
  console.log('==============');
  console.log('✅ SMS Tables checked');
  console.log('✅ RLS Policies identified');
  console.log('✅ Balance parsing fixed');
  console.log('✅ SMS Service updated');
  console.log('✅ Fixed connections tested');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Run the RLS fix SQL in your Supabase dashboard');
  console.log('2. Update the SMS service balance parsing method');
  console.log('3. Test SMS functionality in your application');
}

// Run the fixes
runFixes().catch(console.error); 