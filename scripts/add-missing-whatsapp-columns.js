/**
 * Add Missing WhatsApp Auto-Reply Rules Columns
 * 
 * This script adds the missing enhanced columns to the whatsapp_auto_reply_rules table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addMissingColumns() {
  console.log('🔧 Adding missing WhatsApp auto-reply rules columns...\n');
  
  try {
    // First, let's check what columns currently exist
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnError } = await supabase
      .from('whatsapp_auto_reply_rules')
      .select('*')
      .limit(1);

    if (columnError) {
      console.error('❌ Error checking table structure:', columnError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('📋 Current columns:', Object.keys(columns[0]));
    }

    // Try to insert a test record with the enhanced fields
    console.log('\n🧪 Testing insertion with enhanced fields...');
    const { data: testRule, error: testError } = await supabase
      .from('whatsapp_auto_reply_rules')
      .insert({
        trigger: 'test_enhanced',
        response: 'test_enhanced_response',
        enabled: true,
        case_sensitive: false,
        exact_match: false,
        priority: 1,
        category: 'general',
        delay_seconds: 0,
        max_uses_per_day: 0,
        current_uses_today: 0,
        conditions: {},
        variables: {
          useSenderName: false,
          useCurrentTime: false,
          useRandomResponse: false
        }
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Test insertion failed:', testError);
      console.log('\n💡 This suggests the enhanced columns are missing.');
      console.log('🔧 You need to run the migration manually in Supabase dashboard.');
      console.log('\n📝 Run this SQL in your Supabase SQL Editor:');
      console.log(`
-- Add missing columns to whatsapp_auto_reply_rules
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS delay_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses_per_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_uses_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';

-- Update existing rules with default values
UPDATE whatsapp_auto_reply_rules 
SET 
  priority = 1,
  category = 'general',
  delay_seconds = 0,
  max_uses_per_day = 0,
  current_uses_today = 0,
  conditions = '{}',
  variables = '{}'
WHERE priority IS NULL;
      `);
      return;
    }

    console.log('✅ Test insertion successful!');
    console.log('📋 Inserted rule with enhanced fields:', testRule);
    
    // Clean up test rule
    console.log('\n🧹 Cleaning up test rule...');
    const { error: deleteError } = await supabase
      .from('whatsapp_auto_reply_rules')
      .delete()
      .eq('id', testRule.id);

    if (deleteError) {
      console.error('⚠️ Could not clean up test rule:', deleteError);
    } else {
      console.log('✅ Test rule cleaned up successfully');
    }

    console.log('\n🎉 Enhanced columns are working correctly!');
    console.log('💡 The WhatsApp auto-reply system should now work properly.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMissingColumns();
