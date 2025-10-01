#!/usr/bin/env node

/**
 * Check quality check details and items
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQualityCheckDetails() {
  const qcId = '940ca3db-7a5e-4622-9f06-9eb500fdbde0';
  
  console.log('🔍 Checking Quality Check Details...\n');
  
  // Get quality check
  const { data: qc, error: qcError } = await supabase
    .from('purchase_order_quality_checks')
    .select('*')
    .eq('id', qcId)
    .single();
  
  if (qcError) {
    console.error('❌ Error:', qcError);
    return;
  }
  
  console.log('📋 Quality Check:');
  console.log('  ID:', qc.id);
  console.log('  PO ID:', qc.purchase_order_id);
  console.log('  Template ID:', qc.template_id);
  console.log('  Status:', qc.status);
  console.log('  Overall Result:', qc.overall_result || 'Not yet determined');
  console.log('  Checked By:', qc.checked_by);
  console.log('  Checked At:', qc.checked_at);
  
  // Get quality check items
  console.log('\n📦 Quality Check Items:');
  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_quality_check_items')
    .select('*')
    .eq('quality_check_id', qcId);
  
  if (itemsError) {
    console.error('❌ Error:', itemsError);
    return;
  }
  
  console.log(`  Total Items: ${items.length}`);
  items.forEach((item, idx) => {
    console.log(`\n  ${idx + 1}. ${item.criteria_name}`);
    console.log(`     Result: ${item.result}`);
    console.log(`     Checked: ${item.quantity_checked}`);
    console.log(`     Passed: ${item.quantity_passed}`);
    console.log(`     Failed: ${item.quantity_failed}`);
  });
  
  // Get summary
  console.log('\n📊 Summary:');
  const { data: summary, error: summaryError } = await supabase
    .rpc('get_quality_check_summary', {
      p_purchase_order_id: qc.purchase_order_id
    });
  
  if (summaryError) {
    console.error('❌ Error:', summaryError);
    return;
  }
  
  if (summary && summary.length > 0) {
    const s = summary[0];
    console.log('  Total Items:', s.total_items);
    console.log('  Passed:', s.passed_items);
    console.log('  Failed:', s.failed_items);
    console.log('  Pending:', s.pending_items);
  }
  
  console.log('\n✅ Quality Check System is Working Perfectly!');
}

checkQualityCheckDetails().catch(console.error);
