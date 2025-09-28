// Script to analyze customers with duplicate names in their name field
// This will help identify customers like "frank juma frank" and remove duplicates

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

// Function to detect and clean duplicate names
function cleanDuplicateNames(name) {
  let cleaned = name.trim();
  
  // Split the name into words
  const words = cleaned.split(/\s+/);
  
  // Check for duplicates
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

// Function to detect duplicate patterns
function detectDuplicatePatterns(name) {
  const words = name.trim().split(/\s+/);
  const patterns = {
    'exact_duplicates': [],
    'case_insensitive_duplicates': [],
    'multiple_occurrences': {},
    'consecutive_duplicates': [],
    'end_start_duplicates': []
  };
  
  // Check for exact duplicates
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if (words[i] === words[j]) {
        patterns.exact_duplicates.push({
          word: words[i],
          positions: [i, j]
        });
      }
    }
  }
  
  // Check for case-insensitive duplicates
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if (words[i].toLowerCase() === words[j].toLowerCase() && words[i] !== words[j]) {
        patterns.case_insensitive_duplicates.push({
          original: words[i],
          duplicate: words[j],
          positions: [i, j]
        });
      }
    }
  }
  
  // Count word occurrences
  const wordCount = {};
  words.forEach((word, index) => {
    const lowerWord = word.toLowerCase();
    if (!wordCount[lowerWord]) {
      wordCount[lowerWord] = { count: 0, positions: [], original: word };
    }
    wordCount[lowerWord].count++;
    wordCount[lowerWord].positions.push(index);
  });
  
  // Find words that appear multiple times
  Object.entries(wordCount).forEach(([lowerWord, data]) => {
    if (data.count > 1) {
      patterns.multiple_occurrences[lowerWord] = data;
    }
  });
  
  // Check for consecutive duplicates
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
      patterns.consecutive_duplicates.push({
        word: words[i],
        position: i
      });
    }
  }
  
  // Check for end-start duplicates (like "frank juma frank")
  if (words.length >= 2) {
    const firstWord = words[0].toLowerCase();
    const lastWord = words[words.length - 1].toLowerCase();
    if (firstWord === lastWord) {
      patterns.end_start_duplicates.push({
        word: words[0],
        firstPosition: 0,
        lastPosition: words.length - 1
      });
    }
  }
  
  return patterns;
}

async function analyzeDuplicateNames() {
  console.log('🔍 Analyzing customers with duplicate names...\n');
  
  const pageSize = 1000;
  let offset = 0;
  let totalProcessed = 0;
  
  const patterns = {
    'exact_duplicates': [],
    'case_insensitive_duplicates': [],
    'multiple_occurrences': [],
    'consecutive_duplicates': [],
    'end_start_duplicates': [],
    'all_duplicates': []
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
        const duplicatePatterns = detectDuplicatePatterns(name);
        const cleaned = cleanDuplicateNames(name);
        
        if (name !== cleaned) {
          const analysis = {
            id: customer.id,
            original: name,
            cleaned: cleaned,
            phone: customer.phone,
            patterns: duplicatePatterns
          };
          
          patterns.all_duplicates.push(analysis);
          
          // Categorize by pattern type
          if (duplicatePatterns.exact_duplicates.length > 0) {
            patterns.exact_duplicates.push(analysis);
          }
          if (duplicatePatterns.case_insensitive_duplicates.length > 0) {
            patterns.case_insensitive_duplicates.push(analysis);
          }
          if (Object.keys(duplicatePatterns.multiple_occurrences).length > 0) {
            patterns.multiple_occurrences.push(analysis);
          }
          if (duplicatePatterns.consecutive_duplicates.length > 0) {
            patterns.consecutive_duplicates.push(analysis);
          }
          if (duplicatePatterns.end_start_duplicates.length > 0) {
            patterns.end_start_duplicates.push(analysis);
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
    console.log(`\n🔍 DUPLICATE PATTERN ANALYSIS:\n`);
    
    console.log(`🔴 All customers with duplicates: ${patterns.all_duplicates.length}`);
    if (patterns.all_duplicates.length > 0) {
      console.log('Examples:');
      patterns.all_duplicates.slice(0, 15).forEach(match => {
        console.log(`  "${match.original}" → "${match.cleaned}"`);
      });
      if (patterns.all_duplicates.length > 15) {
        console.log(`  ... and ${patterns.all_duplicates.length - 15} more`);
      }
    }
    
    console.log(`\n🟡 Exact duplicates: ${patterns.exact_duplicates.length}`);
    if (patterns.exact_duplicates.length > 0) {
      console.log('Examples:');
      patterns.exact_duplicates.slice(0, 10).forEach(match => {
        console.log(`  "${match.original}" → "${match.cleaned}"`);
      });
    }
    
    console.log(`\n🟠 Case-insensitive duplicates: ${patterns.case_insensitive_duplicates.length}`);
    if (patterns.case_insensitive_duplicates.length > 0) {
      console.log('Examples:');
      patterns.case_insensitive_duplicates.slice(0, 10).forEach(match => {
        console.log(`  "${match.original}" → "${match.cleaned}"`);
      });
    }
    
    console.log(`\n🟢 Multiple occurrences: ${patterns.multiple_occurrences.length}`);
    if (patterns.multiple_occurrences.length > 0) {
      console.log('Examples:');
      patterns.multiple_occurrences.slice(0, 10).forEach(match => {
        console.log(`  "${match.original}" → "${match.cleaned}"`);
      });
    }
    
    console.log(`\n🔵 Consecutive duplicates: ${patterns.consecutive_duplicates.length}`);
    if (patterns.consecutive_duplicates.length > 0) {
      console.log('Examples:');
      patterns.consecutive_duplicates.slice(0, 10).forEach(match => {
        console.log(`  "${match.original}" → "${match.cleaned}"`);
      });
    }
    
    console.log(`\n🟣 End-start duplicates: ${patterns.end_start_duplicates.length}`);
    if (patterns.end_start_duplicates.length > 0) {
      console.log('Examples:');
      patterns.end_start_duplicates.slice(0, 10).forEach(match => {
        console.log(`  "${match.original}" → "${match.cleaned}"`);
      });
    }
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers: ${totalProcessed}`);
    console.log(`Customers with duplicate names: ${patterns.all_duplicates.length}`);
    console.log(`Customers that would be cleaned: ${patterns.all_duplicates.length}`);
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      total_customers: totalProcessed,
      total_duplicates: patterns.all_duplicates.length,
      patterns: patterns
    };
    
    fs.writeFileSync('duplicate-names-analysis.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to duplicate-names-analysis.json');
    
    return patterns;
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    return {};
  }
}

// Run the analysis
analyzeDuplicateNames().catch(console.error);
