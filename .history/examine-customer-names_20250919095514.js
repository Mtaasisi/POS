// Script to examine customer names and identify patterns that need cleaning
// This will help identify customers with names like "Andrew w 255754254049"

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function examineCustomerNames() {
  console.log('🔍 Examining customer names for cleanup patterns...\n');
  
  try {
    // Get all customers with their names
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching customers:', error);
      return;
    }
    
    console.log(`📊 Total customers found: ${customers.length}\n`);
    
    // Patterns to look for
    const patterns = {
      'w_prefix_with_number': /^(.+?)\s+w\s+\d+$/i,
      'w_prefix_only': /^(.+?)\s+w$/i,
      'mobile_number_suffix': /^(.+?)\s+\d{10,15}$/,
      'multiple_spaces': /\s{2,}/,
      'special_characters': /[^\w\s]/,
      'numbers_in_name': /\d+/
    };
    
    const matches = {
      'w_prefix_with_number': [],
      'w_prefix_only': [],
      'mobile_number_suffix': [],
      'multiple_spaces': [],
      'special_characters': [],
      'numbers_in_name': [],
      'clean_names': []
    };
    
    // Analyze each customer name
    customers.forEach(customer => {
      const name = customer.name.trim();
      let matched = false;
      
      // Check for "w" prefix with number (like "Andrew w 255754254049")
      if (patterns.w_prefix_with_number.test(name)) {
        const match = name.match(patterns.w_prefix_with_number);
        matches.w_prefix_with_number.push({
          id: customer.id,
          original: name,
          clean: match[1].trim(),
          phone: customer.phone
        });
        matched = true;
      }
      
      // Check for "w" prefix only
      if (!matched && patterns.w_prefix_only.test(name)) {
        const match = name.match(patterns.w_prefix_only);
        matches.w_prefix_only.push({
          id: customer.id,
          original: name,
          clean: match[1].trim(),
          phone: customer.phone
        });
        matched = true;
      }
      
      // Check for mobile number suffix
      if (!matched && patterns.mobile_number_suffix.test(name)) {
        const match = name.match(patterns.mobile_number_suffix);
        matches.mobile_number_suffix.push({
          id: customer.id,
          original: name,
          clean: match[1].trim(),
          phone: customer.phone
        });
        matched = true;
      }
      
      // Check for multiple spaces
      if (!matched && patterns.multiple_spaces.test(name)) {
        matches.multiple_spaces.push({
          id: customer.id,
          original: name,
          clean: name.replace(/\s{2,}/g, ' ').trim(),
          phone: customer.phone
        });
        matched = true;
      }
      
      // Check for special characters
      if (!matched && patterns.special_characters.test(name)) {
        matches.special_characters.push({
          id: customer.id,
          original: name,
          clean: name.replace(/[^\w\s]/g, '').replace(/\s{2,}/g, ' ').trim(),
          phone: customer.phone
        });
        matched = true;
      }
      
      // Check for numbers in name
      if (!matched && patterns.numbers_in_name.test(name)) {
        matches.numbers_in_name.push({
          id: customer.id,
          original: name,
          clean: name.replace(/\d+/g, '').replace(/\s{2,}/g, ' ').trim(),
          phone: customer.phone
        });
        matched = true;
      }
      
      // Clean names
      if (!matched) {
        matches.clean_names.push({
          id: customer.id,
          original: name,
          phone: customer.phone
        });
      }
    });
    
    // Display results
    console.log('📋 ANALYSIS RESULTS:\n');
    
    console.log(`🔴 Names with "w" prefix + number: ${matches.w_prefix_with_number.length}`);
    if (matches.w_prefix_with_number.length > 0) {
      console.log('Examples:');
      matches.w_prefix_with_number.slice(0, 5).forEach(match => {
        console.log(`  "${match.original}" → "${match.clean}"`);
      });
      if (matches.w_prefix_with_number.length > 5) {
        console.log(`  ... and ${matches.w_prefix_with_number.length - 5} more`);
      }
    }
    
    console.log(`\n🟡 Names with "w" prefix only: ${matches.w_prefix_only.length}`);
    if (matches.w_prefix_only.length > 0) {
      console.log('Examples:');
      matches.w_prefix_only.slice(0, 5).forEach(match => {
        console.log(`  "${match.original}" → "${match.clean}"`);
      });
    }
    
    console.log(`\n🟠 Names with mobile number suffix: ${matches.mobile_number_suffix.length}`);
    if (matches.mobile_number_suffix.length > 0) {
      console.log('Examples:');
      matches.mobile_number_suffix.slice(0, 5).forEach(match => {
        console.log(`  "${match.original}" → "${match.clean}"`);
      });
    }
    
    console.log(`\n🟢 Names with multiple spaces: ${matches.multiple_spaces.length}`);
    console.log(`🔵 Names with special characters: ${matches.special_characters.length}`);
    console.log(`🟣 Names with numbers: ${matches.numbers_in_name.length}`);
    console.log(`✅ Clean names: ${matches.clean_names.length}`);
    
    // Summary
    const totalIssues = matches.w_prefix_with_number.length + 
                       matches.w_prefix_only.length + 
                       matches.mobile_number_suffix.length + 
                       matches.multiple_spaces.length + 
                       matches.special_characters.length + 
                       matches.numbers_in_name.length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total customers: ${customers.length}`);
    console.log(`Names needing cleanup: ${totalIssues}`);
    console.log(`Clean names: ${matches.clean_names.length}`);
    
    // Save detailed results to file
    const fs = require('fs');
    const results = {
      timestamp: new Date().toISOString(),
      total_customers: customers.length,
      total_issues: totalIssues,
      clean_names: matches.clean_names.length,
      matches: matches
    };
    
    fs.writeFileSync('customer-name-analysis.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to customer-name-analysis.json');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Run the analysis
examineCustomerNames();
