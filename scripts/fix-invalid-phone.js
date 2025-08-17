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

async function fixInvalidPhone() {
  console.log('🔧 Fixing invalid phone number...\n');
  
  try {
    // Find the customer with invalid phone number
    const { data: invalidCustomer, error } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .eq('name', 'iuyf')
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return;
    }

    if (!invalidCustomer) {
      console.log('Customer "iuyf" not found.');
      return;
    }

    console.log('📋 Invalid Customer Details:');
    console.log(`   • Name: ${invalidCustomer.name}`);
    console.log(`   • Current Phone: "${invalidCustomer.phone}"`);
    console.log(`   • ID: ${invalidCustomer.id}`);
    console.log(`   • Created: ${invalidCustomer.created_at}\n`);

    // Options to fix the invalid phone number
    console.log('💡 Options to fix this:');
    console.log('   1. Set phone to null (remove phone number)');
    console.log('   2. Set a placeholder phone number');
    console.log('   3. Delete the customer');
    console.log('   4. Manually update with correct phone number\n');

    // For now, let's set it to null since it's clearly invalid
    const { error: updateError } = await supabase
      .from('customers')
      .update({ phone: null })
      .eq('id', invalidCustomer.id);

    if (updateError) {
      console.error('❌ Error updating customer:', updateError);
    } else {
      console.log('✅ Successfully removed invalid phone number for customer "iuyf"');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: verifyCustomer, error: verifyError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('name', 'iuyf')
      .single();

    if (verifyError) {
      console.error('Error verifying fix:', verifyError);
    } else {
      console.log(`   • Name: ${verifyCustomer.name}`);
      console.log(`   • Phone: ${verifyCustomer.phone || 'null'}`);
    }

    // Final check - count customers with invalid phone numbers
    const { data: allCustomers, error: countError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .not('phone', 'is', null)
      .neq('phone', '');

    if (countError) {
      console.error('Error counting customers:', countError);
    } else {
      const invalidCount = allCustomers.filter(c => {
        const phone = c.phone;
        return !phone.startsWith('+') || phone.length < 8 || phone.length > 15;
      }).length;

      console.log(`\n📊 Final Status:`);
      console.log(`   • Total customers with phone numbers: ${allCustomers.length}`);
      console.log(`   • Invalid phone numbers: ${invalidCount}`);
      
      if (invalidCount === 0) {
        console.log('✅ All phone numbers are now properly formatted!');
      } else {
        console.log(`⚠️  ${invalidCount} phone numbers still need attention.`);
      }
    }

  } catch (error) {
    console.error('Error fixing invalid phone:', error);
  }
}

fixInvalidPhone();
