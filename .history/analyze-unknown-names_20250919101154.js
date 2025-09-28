// Script to analyze customers with proper names but also "Unknown" as another name
// This will help identify customers with mixed naming patterns

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeUnknownNames() {
  console.log('🔍 Analyzing customers with proper names and "Unknown" patterns...\n');
  
  const pageSize = 1000;
  let offset = 0;
  let totalProcessed = 0;
  
  const patterns = {
    'contains_unknown': [],
    'ends_with_unknown': [],
    'starts_with_unknown': [],
    'multiple_unknown': [],
    'unknown_with_proper_name': [],
    'proper_name_with_unknown': []
  };
  
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
        const name = customer.name.trim();
        
        // Check for various "Unknown" patterns
        if (name.toLowerCase().includes('unknown')) {
          patterns.contains_unknown.push({
            id: customer.id,
            name: name,
            phone: customer.phone
          });
          
          // Check if it ends with "Unknown"
          if (name.toLowerCase().endsWith('unknown')) {
            patterns.ends_with_unknown.push({
              id: customer.id,
              name: name,
              phone: customer.phone
            });
          }
          
          // Check if it starts with "Unknown"
          if (name.toLowerCase().startsWith('unknown')) {
            patterns.starts_with_unknown.push({
              id: customer.id,
              name: name,
              phone: customer.phone
            });
          }
          
          // Check for multiple "Unknown" occurrences
          const unknownCount = (name.toLowerCase().match(/unknown/g) || []).length;
          if (unknownCount > 1) {
            patterns.multiple_unknown.push({
              id: customer.id,
              name: name,
              phone: customer.phone,
              count: unknownCount
            });
          }
          
          // Check for proper name + "Unknown" pattern
          const parts = name.split(/\s+/);
          const hasProperName = parts.some(part => 
            part.length > 2 && 
            !part.toLowerCase().includes('unknown') && 
            !part.match(/^\d+$/) && 
            !part.match(/^[^a-zA-Z]+$/)
          );
          
          if (hasProperName) {
            patterns.unknown_with_proper_name.push({
              id: customer.id,
              name: name,
              phone: customer.phone,
              properParts: parts.filter(part => 
                part.length > 2 && 
                !part.toLowerCase().includes('unknown') && 
                !part.match(/^\d+$/) && 
                !part.match(/^[^a-zA-Z]+$/)
              )
            });
          }
          
          // Check for "Unknown" + proper name pattern
          if (name.toLowerCase().startsWith('unknown') && hasProperName) {
            patterns.proper_name_with_unknown.push({
              id: customer.id,
              name: name,
              phone: customer.phone
            });
          }
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
    
    console.log(`\n📊 ANALYSIS RESULTS:`);
    console.log(`Total customers processed: ${totalProcessed}`);
    console.log(`\n🔍 PATTERN ANALYSIS:\n`);
    
    console.log(`🔴 Contains "Unknown": ${patterns.contains_unknown.length}`);
    if (patterns.contains_unknown.length > 0) {
      console.log('Examples:');
      patterns.contains_unknown.slice(0, 10).forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
      if (patterns.contains_unknown.length > 10) {
        console.log(`  ... and ${patterns.contains_unknown.length - 10} more`);
      }
    }
    
    console.log(`\n🟡 Ends with "Unknown": ${patterns.ends_with_unknown.length}`);
    if (patterns.ends_with_unknown.length > 0) {
      console.log('Examples:');
      patterns.ends_with_unknown.slice(0, 10).forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    console.log(`\n🟠 Starts with "Unknown": ${patterns.starts_with_unknown.length}`);
    if (patterns.starts_with_unknown.length > 0) {
      console.log('Examples:');
      patterns.starts_with_unknown.slice(0, 10).forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    console.log(`\n🟢 Multiple "Unknown" occurrences: ${patterns.multiple_unknown.length}`);
    if (patterns.multiple_unknown.length > 0) {
      console.log('Examples:');
      patterns.multiple_unknown.slice(0, 10).forEach(match => {
        console.log(`  "${match.name}" (${match.count} times) (ID: ${match.id})`);
      });
    }
    
    console.log(`\n🔵 Proper name + "Unknown": ${patterns.unknown_with_proper_name.length}`);
    if (patterns.unknown_with_proper_name.length > 0) {
      console.log('Examples:');
      patterns.unknown_with_proper_name.slice(0, 15).forEach(match => {
        console.log(`  "${match.name}"`);
        console.log(`    Proper parts: ${match.properParts.join(', ')}`);
        console.log(`    Phone: ${match.phone}\n`);
      });
    }
    
    console.log(`\n🟣 "Unknown" + Proper name: ${patterns.proper_name_with_unknown.length}`);
    if (patterns.proper_name_with_unknown.length > 0) {
      console.log('Examples:');
      patterns.proper_name_with_unknown.slice(0, 10).forEach(match => {
        console.log(`  "${match.name}" (ID: ${match.id})`);
      });
    }
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers: ${totalProcessed}`);
    console.log(`Customers with "Unknown" in name: ${patterns.contains_unknown.length}`);
    console.log(`Customers with proper name + "Unknown": ${patterns.unknown_with_proper_name.length}`);
    console.log(`Customers with "Unknown" + proper name: ${patterns.proper_name_with_unknown.length}`);
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      total_customers: totalProcessed,
      patterns: patterns
    };
    
    fs.writeFileSync('unknown-names-analysis.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to unknown-names-analysis.json');
    
    return patterns;
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    return {};
  }
}

// Run the analysis
analyzeUnknownNames().catch(console.error);
