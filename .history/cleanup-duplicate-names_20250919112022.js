// Script to clean up customers with duplicate names
// This will remove duplicate words from customer names like "frank juma frank" → "frank juma"

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

// Function to clean duplicate names
function cleanDuplicateNames(name) {
  let cleaned = name.trim();
  
  // Split the name into words
  const words = cleaned.split(/\s+/);
  
  // Remove duplicates while preserving order
  const uniqueWords = [];
  const seen = new Set();
  
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (!seen.has(lowerWord)) {
      seen.add(lowerWord);
      uniqueWords.push(word);
    }
  }
  
  const result = uniqueWords.join(' ');
  
  return result !== cleaned ? result : cleaned;
}

async function previewDuplicateCleanup() {
  console.log('🔍 Previewing cleanup of customers with duplicate names...\n');
  
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
        const cleaned = cleanDuplicateNames(original);
        
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
      changes.slice(0, 30).forEach((change, index) => {
        console.log(`${index + 1}. ID: ${change.id}`);
        console.log(`   Original: "${change.original}"`);
        console.log(`   Cleaned:  "${change.cleaned}"`);
        console.log(`   Phone:    ${change.phone}\n`);
      });
      
      if (changes.length > 30) {
        console.log(`   ... and ${changes.length - 30} more changes`);
      }
    }
    
    return changes;
    
  } catch (error) {
    console.error('❌ Error during preview:', error);
    return [];
  }
}

async function applyDuplicateCleanup() {
  console.log('🔄 Applying cleanup of customers with duplicate names...\n');
  
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
        const cleaned = cleanDuplicateNames(original);
        
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
    console.log('This will remove duplicate words from customer names');
    console.log('Press Ctrl+C to cancel, or wait 10 seconds to continue...\n');
    
    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await applyDuplicateCleanup();
  } else {
    // Preview mode
    await previewDuplicateCleanup();
    console.log('\n💡 To apply changes, run: node cleanup-duplicate-names.js --apply');
  }
}

// Run the script
main().catch(console.error);
