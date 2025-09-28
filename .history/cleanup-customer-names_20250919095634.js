// Customer Name Cleanup Script
// This script safely cleans customer names by removing unwanted patterns
// Based on analysis showing customers with "w" prefix + number pattern

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to clean a name based on patterns
function cleanCustomerName(name) {
  let cleaned = name.trim();
  
  // Pattern 1: "w" prefix + number (like "Andrew w 255754254049")
  if (/^(.+?)\s+w\s+\d+$/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(.+?)\s+w\s+\d+$/i, '$1');
  }
  
  // Pattern 2: "w" prefix only
  if (/^(.+?)\s+w$/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(.+?)\s+w$/i, '$1');
  }
  
  // Pattern 3: Mobile number suffix (10-15 digits)
  if (/^(.+?)\s+\d{10,15}$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(.+?)\s+\d{10,15}$/, '$1');
  }
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  // Trim again
  cleaned = cleaned.trim();
  
  return cleaned;
}

async function previewCleanup() {
  console.log('🔍 Previewing customer name cleanup...\n');
  
  try {
    // Get customers that need cleaning
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .or('name.like.* w %*%,name.like.* w,name.like.*%*%')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching customers:', error);
      return;
    }
    
    console.log(`📊 Found ${customers.length} customers that may need cleaning\n`);
    
    const changes = [];
    
    customers.forEach(customer => {
      const original = customer.name;
      const cleaned = cleanCustomerName(original);
      
      if (original !== cleaned) {
        changes.push({
          id: customer.id,
          original: original,
          cleaned: cleaned,
          phone: customer.phone
        });
      }
    });
    
    console.log(`🔄 ${changes.length} customers will be updated:\n`);
    
    changes.forEach((change, index) => {
      console.log(`${index + 1}. ID: ${change.id}`);
      console.log(`   Original: "${change.original}"`);
      console.log(`   Cleaned:  "${change.cleaned}"`);
      console.log(`   Phone:    ${change.phone}\n`);
    });
    
    return changes;
    
  } catch (error) {
    console.error('❌ Error during preview:', error);
    return [];
  }
}

async function applyCleanup(dryRun = true) {
  console.log(dryRun ? '🔍 Running cleanup in DRY RUN mode...\n' : '🔄 Applying customer name cleanup...\n');
  
  try {
    // Get all customers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching customers:', error);
      return;
    }
    
    console.log(`📊 Processing ${customers.length} customers...\n`);
    
    const changes = [];
    let updated = 0;
    
    for (const customer of customers) {
      const original = customer.name;
      const cleaned = cleanCustomerName(original);
      
      if (original !== cleaned) {
        changes.push({
          id: customer.id,
          original: original,
          cleaned: cleaned,
          phone: customer.phone
        });
        
        if (!dryRun) {
          // Apply the update
          const { error: updateError } = await supabase
            .from('customers')
            .update({ 
              name: cleaned,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer.id);
          
          if (updateError) {
            console.error(`❌ Error updating customer ${customer.id}:`, updateError);
          } else {
            updated++;
            console.log(`✅ Updated: "${original}" → "${cleaned}"`);
          }
        }
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers processed: ${customers.length}`);
    console.log(`Customers needing cleanup: ${changes.length}`);
    
    if (dryRun) {
      console.log(`🔄 DRY RUN: ${changes.length} customers would be updated`);
      console.log('\nTo apply changes, run: node cleanup-customer-names.js --apply');
    } else {
      console.log(`✅ Successfully updated: ${updated} customers`);
    }
    
    return changes;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');
  
  if (applyChanges) {
    console.log('⚠️  WARNING: This will modify customer data in the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await applyCleanup(false);
  } else {
    // Preview mode
    await previewCleanup();
    console.log('\n💡 To apply changes, run: node cleanup-customer-names.js --apply');
  }
}

// Run the script
main().catch(console.error);
