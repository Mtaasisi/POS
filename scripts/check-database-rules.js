/**
 * Check Database Auto-Reply Rules
 * 
 * This script checks what auto-reply rules are currently in the database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabaseRules() {
  console.log('🔍 Checking Database Auto-Reply Rules...\n');
  
  try {
    // Get all auto-reply rules
    const { data: rules, error } = await supabase
      .from('whatsapp_auto_reply_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching rules:', error);
      return;
    }

    if (!rules || rules.length === 0) {
      console.log('📋 No auto-reply rules found in database');
      console.log('💡 Run: node scripts/setup-whatsapp-tables.js to create default rules');
      return;
    }

    console.log(`📋 Found ${rules.length} auto-reply rules:\n`);
    
    rules.forEach((rule, index) => {
      console.log(`${index + 1}. Rule ID: ${rule.id}`);
      console.log(`   Trigger: "${rule.trigger}"`);
      console.log(`   Response: "${rule.response}"`);
      console.log(`   Enabled: ${rule.enabled ? '✅ Yes' : '❌ No'}`);
      console.log(`   Case Sensitive: ${rule.case_sensitive ? 'Yes' : 'No'}`);
      console.log(`   Exact Match: ${rule.exact_match ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(rule.created_at).toLocaleString()}`);
      console.log('');
    });

    // Check enabled rules specifically
    const enabledRules = rules.filter(rule => rule.enabled);
    console.log(`✅ ${enabledRules.length} rules are currently enabled`);
    
    if (enabledRules.length === 0) {
      console.log('⚠️ No enabled rules found! Auto-replies will not work.');
      console.log('💡 Enable some rules in the WhatsApp Management page');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseRules().catch(console.error);
