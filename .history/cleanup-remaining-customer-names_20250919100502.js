// Targeted cleanup for remaining customer names with "w" prefix and mobile number patterns
// For the larger database with 45,078 customers

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

// Function to clean a name based on specific patterns
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

async function findAndCleanRemainingCustomers() {
  console.log('🔍 Finding and cleaning remaining customers with "w" prefix and mobile number patterns...\n');
  
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
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers processed: ${customers.length}`);
    console.log(`Customers needing cleanup: ${changes.length}`);
    console.log(`✅ Successfully updated: ${updated} customers`);
    
    if (changes.length > 0) {
      console.log('\n📋 DETAILED CHANGES:');
      changes.forEach((change, index) => {
        console.log(`${index + 1}. ID: ${change.id}`);
        console.log(`   Original: "${change.original}"`);
        console.log(`   Cleaned:  "${change.cleaned}"`);
        console.log(`   Phone:    ${change.phone}\n`);
      });
    }
    
    return changes;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return [];
  }
}

async function verifyCleanup() {
  console.log('🔍 Verifying cleanup results...\n');
  
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
    
    const patterns = {
      'w_prefix_with_number': /^(.+?)\s+w\s+\d+$/i,
      'w_prefix_only': /^(.+?)\s+w$/i,
      'mobile_number_suffix': /^(.+?)\s+\d{10,15}$/
    };
    
    const matches = {
      'w_prefix_with_number': [],
      'w_prefix_only': [],
      'mobile_number_suffix': []
    };
    
    // Check for remaining patterns
    customers.forEach(customer => {
      const name = customer.name.trim();
      
      if (patterns.w_prefix_with_number.test(name)) {
        matches.w_prefix_with_number.push({
          id: customer.id,
          name: name,
          phone: customer.phone
        });
      }
      
      if (patterns.w_prefix_only.test(name)) {
        matches.w_prefix_only.push({
          id: customer.id,
          name: name,
          phone: customer.phone
        });
      }
      
      if (patterns.mobile_number_suffix.test(name)) {
        matches.mobile_number_suffix.push({
          id: customer.id,
          name: name,
          phone: customer.phone
        });
      }
    });
    
    console.log('📊 VERIFICATION RESULTS:\n');
    console.log(`🔴 Names with "w" prefix + number: ${matches.w_prefix_with_number.length}`);
    if (matches.w_prefix_with_number.length > 0) {
      console.log('Examples:');
      matches.w_prefix_with_number.forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    console.log(`\n🟡 Names with "w" prefix only: ${matches.w_prefix_only.length}`);
    if (matches.w_prefix_only.length > 0) {
      console.log('Examples:');
      matches.w_prefix_only.forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    console.log(`\n🟠 Names with mobile number suffix: ${matches.mobile_number_suffix.length}`);
    if (matches.mobile_number_suffix.length > 0) {
      console.log('Examples:');
      matches.mobile_number_suffix.forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    const totalRemaining = matches.w_prefix_with_number.length + 
                          matches.w_prefix_only.length + 
                          matches.mobile_number_suffix.length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers: ${customers.length}`);
    console.log(`Remaining issues: ${totalRemaining}`);
    
    if (totalRemaining === 0) {
      console.log('✅ All customer names are now clean!');
    } else {
      console.log('⚠️  Some customers still need manual review.');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    await verifyCleanup();
  } else {
    console.log('⚠️  WARNING: This will modify customer data in the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await findAndCleanRemainingCustomers();
    
    console.log('\n💡 To verify results, run: node cleanup-remaining-customer-names.js --verify');
  }
}

// Run the script
main().catch(console.error);
