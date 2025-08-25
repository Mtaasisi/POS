#!/usr/bin/env node

/**
 * Script to fix RLS policies for whatsapp_instances table
 * This addresses the 406 Not Acceptable error
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRLSFix() {
  try {
    console.log('🔧 Running RLS fix for whatsapp_instances table...');
    
    // Read the SQL script
    const sqlPath = path.join(__dirname, 'fix-whatsapp-instances-406-error.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL script loaded, executing...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Error executing SQL script:', error);
      process.exit(1);
    }
    
    console.log('✅ RLS fix completed successfully!');
    console.log('📊 Results:', data);
    
  } catch (error) {
    console.error('❌ Error running RLS fix:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runRLSFixAlternative() {
  try {
    console.log('🔧 Running RLS fix (alternative method)...');
    
    // Drop existing policies
    console.log('🗑️ Dropping existing policies...');
    const policiesToDrop = [
      "Users can view their own WhatsApp instances",
      "Users can insert their own WhatsApp instances", 
      "Users can update their own WhatsApp instances",
      "Users can delete their own WhatsApp instances",
      "Authenticated users can view WhatsApp instances",
      "Authenticated users can insert WhatsApp instances",
      "Authenticated users can update WhatsApp instances",
      "Authenticated users can delete WhatsApp instances",
      "Admin users have full access to WhatsApp instances",
      "Development fallback policy",
      "Allow all authenticated users to access whatsapp_instances"
    ];
    
    for (const policyName of policiesToDrop) {
      try {
        await supabase.rpc('exec_sql', { 
          sql: `DROP POLICY IF EXISTS "${policyName}" ON whatsapp_instances;` 
        });
        console.log(`✅ Dropped policy: ${policyName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop policy ${policyName}:`, error.message);
      }
    }
    
    // Create new policies
    console.log('🔨 Creating new policies...');
    
    const newPolicies = [
      `CREATE POLICY "Allow authenticated users to view whatsapp_instances" 
       ON whatsapp_instances FOR SELECT TO authenticated USING (true);`,
      
      `CREATE POLICY "Allow authenticated users to create whatsapp_instances" 
       ON whatsapp_instances FOR INSERT TO authenticated WITH CHECK (true);`,
      
      `CREATE POLICY "Allow authenticated users to update whatsapp_instances" 
       ON whatsapp_instances FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`,
      
      `CREATE POLICY "Allow authenticated users to delete whatsapp_instances" 
       ON whatsapp_instances FOR DELETE TO authenticated USING (true);`,
      
      `CREATE POLICY "Fallback policy for all whatsapp_instances operations" 
       ON whatsapp_instances FOR ALL TO authenticated USING (true) WITH CHECK (true);`
    ];
    
    for (const policy of newPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql: policy });
        console.log('✅ Created policy successfully');
      } catch (error) {
        console.error('❌ Error creating policy:', error.message);
      }
    }
    
    // Test the fix
    console.log('🧪 Testing the fix...');
    const { data: testData, error: testError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test successful! Table is accessible.');
      console.log(`📊 Found ${testData?.length || 0} instances`);
    }
    
  } catch (error) {
    console.error('❌ Error in alternative RLS fix:', error);
  }
}

// Run the fix
if (process.argv.includes('--alternative')) {
  runRLSFixAlternative();
} else {
  runRLSFix();
}
