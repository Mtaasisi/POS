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

async function showAllCustomers() {
  console.log('📋 Full Customer List with Phone Numbers\n');
  
  try {
    // Get all customers with phone numbers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, city, created_at, loyalty_level, color_tag')
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

    console.log(`📊 Total Customers: ${customers.length}\n`);
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ID                                     │ Name                    │ Phone           │ City        │ Created    │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤');

    customers.forEach((customer, index) => {
      const id = customer.id.substring(0, 8) + '...';
      const name = (customer.name || 'N/A').padEnd(24);
      const phone = (customer.phone || 'N/A').padEnd(16);
      const city = (customer.city || 'N/A').padEnd(12);
      const created = new Date(customer.created_at).toLocaleDateString().padEnd(10);
      
      console.log(`│ ${id} │ ${name} │ ${phone} │ ${city} │ ${created} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');

    // Show summary statistics
    console.log('\n📈 Summary Statistics:');
    console.log(`   • Total customers: ${customers.length}`);
    
    // Count customers with duplicate suffixes
    const duplicateSuffixes = customers.filter(c => c.phone.includes('_dup'));
    console.log(`   • Customers with duplicate suffixes: ${duplicateSuffixes.length}`);
    
    // Count by loyalty level
    const loyaltyCounts = {};
    customers.forEach(c => {
      const level = c.loyalty_level || 'unknown';
      loyaltyCounts[level] = (loyaltyCounts[level] || 0) + 1;
    });
    
    console.log('   • Loyalty levels:');
    Object.entries(loyaltyCounts).forEach(([level, count]) => {
      console.log(`     - ${level}: ${count}`);
    });

    // Show customers with duplicate suffixes
    if (duplicateSuffixes.length > 0) {
      console.log('\n⚠️  Customers with Duplicate Phone Suffixes:');
      duplicateSuffixes.forEach(customer => {
        console.log(`   • ${customer.name} (${customer.id.substring(0, 8)}...): ${customer.phone}`);
      });
    }

  } catch (error) {
    console.error('Error showing customers:', error);
  }
}

showAllCustomers();
