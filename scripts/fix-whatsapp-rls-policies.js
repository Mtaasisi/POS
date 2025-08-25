#!/usr/bin/env node

/**
 * Fix WhatsApp RLS Policies Script
 * Fixes Row Level Security policies for WhatsApp tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing WhatsApp RLS Policies...\n');

  try {
    // Test current policies
    console.log('📋 Testing current RLS policies...');
    
    const tables = [
      'whatsapp_instances',
      'green_api_message_queue',
      'green_api_message_templates',
      'green_api_bulk_campaigns'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: Read access working`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n⚠️  Note: RLS policies are currently restrictive.');
    console.log('   This is normal for production security.');
    console.log('   For testing purposes, you can temporarily disable RLS or');
    console.log('   create more permissive policies in your Supabase dashboard.');
    
    console.log('\n📝 To fix RLS policies, run these SQL commands in your Supabase SQL editor:');
    console.log('\n-- Fix WhatsApp Instances RLS');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_instances;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_instances;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_instances;
DROP POLICY IF EXISTS "Enable delete access for all users" ON whatsapp_instances;

-- Create new policies (for testing - make more restrictive for production)
CREATE POLICY "Enable read access for all users" ON whatsapp_instances FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_instances FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_instances FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON whatsapp_instances FOR DELETE USING (true);
    `);

    console.log('\n-- Fix Green API Message Queue RLS');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON green_api_message_queue;
DROP POLICY IF EXISTS "Enable insert access for all users" ON green_api_message_queue;
DROP POLICY IF EXISTS "Enable update access for all users" ON green_api_message_queue;
DROP POLICY IF EXISTS "Enable delete access for all users" ON green_api_message_queue;

-- Create new policies (for testing - make more restrictive for production)
CREATE POLICY "Enable read access for all users" ON green_api_message_queue FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON green_api_message_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON green_api_message_queue FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON green_api_message_queue FOR DELETE USING (true);
    `);

    console.log('\n-- Fix Green API Message Templates RLS');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON green_api_message_templates;
DROP POLICY IF EXISTS "Enable insert access for all users" ON green_api_message_templates;
DROP POLICY IF EXISTS "Enable update access for all users" ON green_api_message_templates;
DROP POLICY IF EXISTS "Enable delete access for all users" ON green_api_message_templates;

-- Create new policies (for testing - make more restrictive for production)
CREATE POLICY "Enable read access for all users" ON green_api_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON green_api_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON green_api_message_templates FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON green_api_message_templates FOR DELETE USING (true);
    `);

    console.log('\n-- Fix Green API Bulk Campaigns RLS');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON green_api_bulk_campaigns;
DROP POLICY IF EXISTS "Enable insert access for all users" ON green_api_bulk_campaigns;
DROP POLICY IF EXISTS "Enable update access for all users" ON green_api_bulk_campaigns;
DROP POLICY IF EXISTS "Enable delete access for all users" ON green_api_bulk_campaigns;

-- Create new policies (for testing - make more restrictive for production)
CREATE POLICY "Enable read access for all users" ON green_api_bulk_campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON green_api_bulk_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON green_api_bulk_campaigns FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON green_api_bulk_campaigns FOR DELETE USING (true);
    `);

    console.log('\n⚠️  Important: These policies allow full access for testing.');
    console.log('   For production, implement proper user-based RLS policies.');
    console.log('   Example: USING (auth.uid() = created_by)');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    process.exit(1);
  }
}

// Run the script
fixRLSPolicies()
  .then(() => {
    console.log('\n✅ RLS policy analysis completed!');
    console.log('   Run the SQL commands above in your Supabase dashboard to fix the policies.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 RLS policy analysis failed:', error);
    process.exit(1);
  });
