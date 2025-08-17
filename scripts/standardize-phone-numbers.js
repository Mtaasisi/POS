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

async function standardizePhoneNumbers() {
  console.log('🔧 Standardizing phone number formats...\n');
  
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

    // Analyze current phone number formats
    const phoneAnalysis = {
      withPlus: 0,
      withoutPlus: 0,
      invalid: 0,
      toUpdate: []
    };

    customers.forEach(customer => {
      const phone = customer.phone;
      
      if (phone.startsWith('+')) {
        phoneAnalysis.withPlus++;
      } else if (phone.match(/^[0-9\s\-()]+$/)) {
        phoneAnalysis.withoutPlus++;
        phoneAnalysis.toUpdate.push(customer);
      } else {
        phoneAnalysis.invalid++;
        console.log(`⚠️  Invalid phone format: ${customer.name} - ${phone}`);
      }
    });

    console.log('📈 Current Phone Number Analysis:');
    console.log(`   • With + sign: ${phoneAnalysis.withPlus}`);
    console.log(`   • Without + sign: ${phoneAnalysis.withoutPlus}`);
    console.log(`   • Invalid format: ${phoneAnalysis.invalid}`);
    console.log(`   • Total to update: ${phoneAnalysis.toUpdate.length}\n`);

    if (phoneAnalysis.toUpdate.length === 0) {
      console.log('✅ All phone numbers are already properly formatted!');
      return;
    }

    // Show examples of what will be updated
    console.log('🔄 Examples of phone numbers to be updated:');
    phoneAnalysis.toUpdate.slice(0, 10).forEach(customer => {
      console.log(`   • ${customer.name}: ${customer.phone} → +${customer.phone}`);
    });
    
    if (phoneAnalysis.toUpdate.length > 10) {
      console.log(`   ... and ${phoneAnalysis.toUpdate.length - 10} more`);
    }

    console.log('\n🔧 Starting phone number standardization...');

    // Update phone numbers to include + sign
    let updatedCount = 0;
    let errorCount = 0;

    for (const customer of phoneAnalysis.toUpdate) {
      const newPhone = `+${customer.phone}`;
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ phone: newPhone })
        .eq('id', customer.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating ${customer.name}:`, updateError);
        errorCount++;
      } else {
        console.log(`   ✅ Updated ${customer.name}: ${customer.phone} → ${newPhone}`);
        updatedCount++;
      }
    }

    console.log('\n📊 Standardization Results:');
    console.log(`   • Successfully updated: ${updatedCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Total processed: ${phoneAnalysis.toUpdate.length}`);

    // Verify the standardization
    console.log('\n🔍 Verifying standardization...');
    const { data: verifyCustomers, error: verifyError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .not('phone', 'is', null)
      .neq('phone', '')
      .order('name');

    if (verifyError) {
      console.error('Error verifying standardization:', verifyError);
      return;
    }

    const withoutPlus = verifyCustomers.filter(c => !c.phone.startsWith('+'));
    
    if (withoutPlus.length === 0) {
      console.log('✅ All phone numbers now have the + sign!');
    } else {
      console.log(`⚠️  Still found ${withoutPlus.length} phone numbers without + sign:`);
      withoutPlus.slice(0, 5).forEach(customer => {
        console.log(`   • ${customer.name}: ${customer.phone}`);
      });
      if (withoutPlus.length > 5) {
        console.log(`   ... and ${withoutPlus.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('Error standardizing phone numbers:', error);
  }
}

standardizePhoneNumbers();
