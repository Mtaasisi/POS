#!/usr/bin/env node

/**
 * Add Database Auto-Reply Rules
 * This script helps you add new exact-match auto-reply rules to the database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// Function to add a new auto-reply rule
async function addAutoReplyRule(trigger, response, exactMatch = true, caseSensitive = false) {
  try {
    console.log(`📝 Adding new auto-reply rule:`);
    console.log(`   Trigger: "${trigger}"`);
    console.log(`   Response: "${response}"`);
    console.log(`   Exact Match: ${exactMatch}`);
    console.log(`   Case Sensitive: ${caseSensitive}`);

    const { data, error } = await supabase
      .from('whatsapp_auto_reply_rules')
      .insert({
        trigger: trigger,
        response: response,
        enabled: true,
        exact_match: exactMatch,
        case_sensitive: caseSensitive,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error adding rule:', error);
      return false;
    }

    console.log('✅ Auto-reply rule added successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding rule:', error);
    return false;
  }
}

// Function to show all current rules
async function showAllRules() {
  try {
    const { data, error } = await supabase
      .from('whatsapp_auto_reply_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching rules:', error);
      return;
    }

    console.log('📋 Current Auto-Reply Rules:\n');
    if (data && data.length > 0) {
      data.forEach((rule, index) => {
        console.log(`${index + 1}. "${rule.trigger}" → "${rule.response}"`);
        console.log(`   ID: ${rule.id} | Enabled: ${rule.enabled} | Exact: ${rule.exact_match} | Case: ${rule.case_sensitive}`);
        console.log('');
      });
    } else {
      console.log('No rules found.');
    }
  } catch (error) {
    console.error('❌ Error showing rules:', error);
  }
}

// Function to delete a rule
async function deleteRule(ruleId) {
  try {
    const { error } = await supabase
      .from('whatsapp_auto_reply_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('❌ Error deleting rule:', error);
      return false;
    }

    console.log(`✅ Rule ${ruleId} deleted successfully!`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting rule:', error);
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('📝 Database Auto-Reply Rule Manager\n');

  switch (command) {
    case 'add':
      const trigger = args[1];
      const response = args[2];
      
      if (!trigger || !response) {
        console.log('❌ Please provide trigger and response');
        console.log('Usage: node add-database-rule.js add "trigger" "response"');
        return;
      }
      
      await addAutoReplyRule(trigger, response);
      break;
    
    case 'show':
      await showAllRules();
      break;
    
    case 'delete':
      const ruleId = args[1];
      if (!ruleId) {
        console.log('❌ Please provide rule ID to delete');
        console.log('Usage: node add-database-rule.js delete <rule_id>');
        return;
      }
      await deleteRule(ruleId);
      break;
    
    case 'examples':
      console.log('📝 Example Auto-Reply Rules:\n');
      console.log('1. Exact match for charger price:');
      console.log('   node add-database-rule.js add "charger price" "Bei ya charger: Tsh 5,000-15,000 kulingana na aina ya simu."');
      console.log('');
      console.log('2. Exact match for screen replacement:');
      console.log('   node add-database-rule.js add "screen price" "Bei ya kubadili screen: iPhone 50,000-150,000, Samsung 30,000-100,000."');
      console.log('');
      console.log('3. Exact match for warranty:');
      console.log('   node add-database-rule.js add "warranty" "Tuna dhamana ya siku 30 kwa huduma zetu. Ikiwa kuna tatizo tena, tutarekebisha bila malipo."');
      console.log('');
      console.log('4. Exact match for weekend hours:');
      console.log('   node add-database-rule.js add "weekend" "Tuna kazi Jumamosi na Jumapili pia! Masaa: 8:00 AM - 8:00 PM."');
      break;
    
    default:
      console.log('📝 Database Auto-Reply Rule Manager Commands:');
      console.log('  add <trigger> <response>  - Add new exact-match rule');
      console.log('  show                     - Show all current rules');
      console.log('  delete <rule_id>         - Delete a rule by ID');
      console.log('  examples                 - Show example commands');
      console.log('');
      console.log('Examples:');
      console.log('  node add-database-rule.js add "charger price" "Bei ya charger: Tsh 5,000-15,000"');
      console.log('  node add-database-rule.js show');
      console.log('  node add-database-rule.js examples');
      break;
  }
}

// Run the script
main().catch(console.error);
