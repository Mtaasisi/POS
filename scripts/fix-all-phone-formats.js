import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to clean and format phone number
function formatPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a valid number, add +
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }
  
  return null;
}

async function fixAllPhoneFormats() {
  console.log('🔧 Fixing all phone number formats...\n');
  
  try {
    // Get all customers with phone numbers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .not('phone', 'is', null)
      .neq('phone', '')
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    if (!customers || customers.length === 0) {
      console.log('No customers found with phone numbers.');
      return;
    }

    console.log(`📊 Total customers to check: ${customers.length}\n`);

    // Analyze and categorize phone numbers
    const analysis = {
      valid: [],
      needsFormatting: [],
      invalid: [],
      toUpdate: []
    };

    customers.forEach(customer => {
      const phone = customer.phone;
      const formatted = formatPhoneNumber(phone);
      
      if (formatted && formatted.startsWith('+') && formatted.length >= 8) {
        if (formatted !== phone) {
          analysis.needsFormatting.push({ ...customer, newPhone: formatted });
          analysis.toUpdate.push({ ...customer, newPhone: formatted });
        } else {
          analysis.valid.push(customer);
        }
      } else {
        analysis.invalid.push(customer);
        console.log(`⚠️  Invalid phone: ${customer.name} - "${phone}"`);
      }
    });

    console.log('📈 Phone Number Analysis:');
    console.log(`   • Valid format: ${analysis.valid.length}`);
    console.log(`   • Needs formatting: ${analysis.needsFormatting.length}`);
    console.log(`   • Invalid format: ${analysis.invalid.length}`);
    console.log(`   • Total to update: ${analysis.toUpdate.length}\n`);

    if (analysis.toUpdate.length === 0) {
      console.log('✅ All phone numbers are properly formatted!');
    } else {
      // Show examples of what will be updated
      console.log('🔄 Examples of phone numbers to be updated:');
      analysis.toUpdate.slice(0, 10).forEach(item => {
        console.log(`   • ${item.name}: "${item.phone}" → "${item.newPhone}"`);
      });
      
      if (analysis.toUpdate.length > 10) {
        console.log(`   ... and ${analysis.toUpdate.length - 10} more`);
      }

      console.log('\n🔧 Starting phone number updates...');

      // Update phone numbers
      let updatedCount = 0;
      let errorCount = 0;

      for (const item of analysis.toUpdate) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ phone: item.newPhone })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating ${item.name}:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Updated ${item.name}: "${item.phone}" → "${item.newPhone}"`);
          updatedCount++;
        }
      }

      console.log('\n📊 Update Results:');
      console.log(`   • Successfully updated: ${updatedCount}`);
      console.log(`   • Errors: ${errorCount}`);
      console.log(`   • Total processed: ${analysis.toUpdate.length}`);
    }

    // Handle invalid phone numbers
    if (analysis.invalid.length > 0) {
      console.log('\n⚠️  Invalid Phone Numbers Found:');
      analysis.invalid.forEach(customer => {
        console.log(`   • ${customer.name}: "${customer.phone}"`);
      });
      
      console.log('\n💡 Recommendations:');
      console.log('   • Review and manually fix invalid phone numbers');
      console.log('   • Consider removing customers with invalid phone numbers');
      console.log('   • Implement phone number validation in the frontend');
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalCustomers, error: verifyError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .not('phone', 'is', null)
      .neq('phone', '')
      .order('name');

    if (verifyError) {
      console.error('Error in final verification:', verifyError);
      return;
    }

    const finalAnalysis = {
      valid: 0,
      invalid: 0
    };

    finalCustomers.forEach(customer => {
      const formatted = formatPhoneNumber(customer.phone);
      if (formatted && formatted.startsWith('+') && formatted.length >= 8) {
        finalAnalysis.valid++;
      } else {
        finalAnalysis.invalid++;
        console.log(`   ⚠️  Still invalid: ${customer.name} - "${customer.phone}"`);
      }
    });

    console.log('\n📊 Final Results:');
    console.log(`   • Valid phone numbers: ${finalAnalysis.valid}`);
    console.log(`   • Invalid phone numbers: ${finalAnalysis.invalid}`);
    console.log(`   • Total customers: ${finalCustomers.length}`);

    if (finalAnalysis.invalid === 0) {
      console.log('✅ All phone numbers are now properly formatted!');
    } else {
      console.log(`⚠️  ${finalAnalysis.invalid} phone numbers still need manual attention.`);
    }

  } catch (error) {
    console.error('Error fixing phone formats:', error);
  }
}

fixAllPhoneFormats();
