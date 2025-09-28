// Script to clean up customers with proper names but also "Unknown"
// This will remove "Unknown" from names that have proper names

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

// Function to clean a name by removing "Unknown" if it has proper names
function cleanUnknownFromName(name) {
  let cleaned = name.trim();
  
  // Check if the name contains "Unknown" and has proper name parts
  if (cleaned.toLowerCase().includes('unknown')) {
    const parts = cleaned.split(/\s+/);
    const properParts = parts.filter(part => 
      part.length > 2 && 
      !part.toLowerCase().includes('unknown') && 
      !part.match(/^\d+$/) && 
      !part.match(/^[^a-zA-Z]+$/) &&
      part.toLowerCase() !== 'customer' &&
      part.toLowerCase() !== 'contact'
    );
    
    // If there are proper name parts, remove "Unknown"
    if (properParts.length > 0) {
      // Remove "Unknown" and clean up
      cleaned = parts.filter(part => 
        !part.toLowerCase().includes('unknown')
      ).join(' ').trim();
      
      // Clean up multiple spaces
      cleaned = cleaned.replace(/\s{2,}/g, ' ');
    }
  }
  
  return cleaned;
}

async function previewUnknownCleanup() {
  console.log('🔍 Previewing cleanup of customers with proper names + "Unknown"...\n');
  
  const pageSize = 1000;
  let offset = 0;
  let totalProcessed = 0;
  const changes = [];
  
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
        break;
      }
      
      // Analyze each customer name
      customers.forEach(customer => {
        const original = customer.name.trim();
        const cleaned = cleanUnknownFromName(original);
        
        if (original !== cleaned) {
          changes.push({
            id: customer.id,
            original: original,
            cleaned: cleaned,
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
    
    console.log(`\n📊 PREVIEW RESULTS:`);
    console.log(`Total customers processed: ${totalProcessed}`);
    console.log(`Customers that would be updated: ${changes.length}\n`);
    
    if (changes.length > 0) {
      console.log('📋 CHANGES THAT WOULD BE MADE:');
      changes.slice(0, 20).forEach((change, index) => {
        console.log(`${index + 1}. ID: ${change.id}`);
        console.log(`   Original: "${change.original}"`);
        console.log(`   Cleaned:  "${change.cleaned}"`);
        console.log(`   Phone:    ${change.phone}\n`);
      });
      
      if (changes.length > 20) {
        console.log(`   ... and ${changes.length - 20} more changes`);
      }
    }
    
    return changes;
    
  } catch (error) {
    console.error('❌ Error during preview:', error);
    return [];
  }
}

async function applyUnknownCleanup() {
  console.log('🔄 Applying cleanup of customers with proper names + "Unknown"...\n');
  
  const pageSize = 1000;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  const changes = [];
  
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
        break;
      }
      
      let batchUpdated = 0;
      
      // Process each customer
      for (const customer of customers) {
        const original = customer.name.trim();
        const cleaned = cleanUnknownFromName(original);
        
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
            batchUpdated++;
            totalUpdated++;
            console.log(`   ✅ Updated: "${original}" → "${cleaned}"`);
          }
        }
      }
      
      totalProcessed += customers.length;
      console.log(`   Batch complete: ${batchUpdated} customers updated\n`);
      
      // If we got fewer customers than pageSize, we've reached the end
      if (customers.length < pageSize) {
        break;
      }
      
      offset += pageSize;
      
      // Add a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`Total customers processed: ${totalProcessed}`);
    console.log(`Total customers updated: ${totalUpdated}`);
    console.log(`Total changes made: ${changes.length}`);
    
    return changes;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--apply')) {
    console.log('⚠️  WARNING: This will modify customer data in the database!');
    console.log('This will remove "Unknown" from customer names that have proper names');
    console.log('Press Ctrl+C to cancel, or wait 10 seconds to continue...\n');
    
    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await applyUnknownCleanup();
  } else {
    // Preview mode
    await previewUnknownCleanup();
    console.log('\n💡 To apply changes, run: node cleanup-unknown-names.js --apply');
  }
}

// Run the script
main().catch(console.error);
