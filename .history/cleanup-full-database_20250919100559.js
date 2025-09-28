// Comprehensive cleanup for the full database with 45,078 customers
// Handles pagination to process all customers

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

async function processAllCustomers() {
  console.log('🔍 Processing all customers in the database...\n');
  
  const pageSize = 1000;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  const allChanges = [];
  
  try {
    while (true) {
      console.log(`📄 Processing batch ${Math.floor(offset / pageSize) + 1} (offset: ${offset})...`);
      
      // Get customers in batches
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .range(offset, offset + pageSize - 1)
        .order('id');
      
      if (error) {
        console.error('❌ Error fetching customers:', error);
        break;
      }
      
      if (!customers || customers.length === 0) {
        console.log('✅ No more customers to process');
        break;
      }
      
      console.log(`   Found ${customers.length} customers in this batch`);
      
      const batchChanges = [];
      let batchUpdated = 0;
      
      for (const customer of customers) {
        const original = customer.name;
        const cleaned = cleanCustomerName(original);
        
        if (original !== cleaned) {
          batchChanges.push({
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
            batchUpdated++;
            console.log(`   ✅ Updated: "${original}" → "${cleaned}"`);
          }
        }
      }
      
      totalProcessed += customers.length;
      totalUpdated += batchUpdated;
      allChanges.push(...batchChanges);
      
      console.log(`   Batch complete: ${batchUpdated} customers updated\n`);
      
      // If we got fewer customers than pageSize, we've reached the end
      if (customers.length < pageSize) {
        break;
      }
      
      offset += pageSize;
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`Total customers processed: ${totalProcessed}`);
    console.log(`Total customers updated: ${totalUpdated}`);
    console.log(`Total changes made: ${allChanges.length}`);
    
    if (allChanges.length > 0) {
      console.log('\n📋 ALL CHANGES MADE:');
      allChanges.forEach((change, index) => {
        console.log(`${index + 1}. ID: ${change.id}`);
        console.log(`   Original: "${change.original}"`);
        console.log(`   Cleaned:  "${change.cleaned}"`);
        console.log(`   Phone:    ${change.phone}\n`);
      });
    }
    
    return allChanges;
    
  } catch (error) {
    console.error('❌ Error during processing:', error);
    return [];
  }
}

async function verifyFullDatabase() {
  console.log('🔍 Verifying cleanup results for the full database...\n');
  
  const pageSize = 1000;
  let offset = 0;
  let totalProcessed = 0;
  
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
  
  try {
    while (true) {
      console.log(`📄 Verifying batch ${Math.floor(offset / pageSize) + 1} (offset: ${offset})...`);
      
      // Get customers in batches
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .range(offset, offset + pageSize - 1)
        .order('id');
      
      if (error) {
        console.error('❌ Error fetching customers:', error);
        break;
      }
      
      if (!customers || customers.length === 0) {
        break;
      }
      
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
      
      totalProcessed += customers.length;
      
      // If we got fewer customers than pageSize, we've reached the end
      if (customers.length < pageSize) {
        break;
      }
      
      offset += pageSize;
      
      // Add a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`Total customers verified: ${totalProcessed}`);
    console.log(`🔴 Names with "w" prefix + number: ${matches.w_prefix_with_number.length}`);
    console.log(`🟡 Names with "w" prefix only: ${matches.w_prefix_only.length}`);
    console.log(`🟠 Names with mobile number suffix: ${matches.mobile_number_suffix.length}`);
    
    if (matches.w_prefix_with_number.length > 0) {
      console.log('\n🔴 Examples with "w" prefix + number:');
      matches.w_prefix_with_number.forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    if (matches.w_prefix_only.length > 0) {
      console.log('\n🟡 Examples with "w" prefix only:');
      matches.w_prefix_only.forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    if (matches.mobile_number_suffix.length > 0) {
      console.log('\n🟠 Examples with mobile number suffix:');
      matches.mobile_number_suffix.forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    const totalRemaining = matches.w_prefix_with_number.length + 
                          matches.w_prefix_only.length + 
                          matches.mobile_number_suffix.length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers: ${totalProcessed}`);
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
    await verifyFullDatabase();
  } else {
    console.log('⚠️  WARNING: This will modify customer data in the database!');
    console.log('This will process ALL customers in the database (45,078+ customers)');
    console.log('Press Ctrl+C to cancel, or wait 10 seconds to continue...\n');
    
    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await processAllCustomers();
    
    console.log('\n💡 To verify results, run: node cleanup-full-database.js --verify');
  }
}

// Run the script
main().catch(console.error);
