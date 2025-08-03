import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to parse CSV file
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const customers = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const customer = {};
      headers.forEach((header, index) => {
        customer[header] = values[index];
      });
      customers.push(customer);
    }
  }
  
  return customers;
}

// Function to parse a single CSV line
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add the last value
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

// Function to update customers from CSV
async function updateCustomersFromCSV(customers) {
  const totalCustomers = customers.length;
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalCustomers} customers from CSV`);

  for (let i = 0; i < totalCustomers; i++) {
    const customer = customers[i];
    const customerNumber = i + 1;

    if (customerNumber % 10 === 0) {
      console.log(`📦 Processing customer ${customerNumber}/${totalCustomers}`);
    }

    try {
      // Convert string values to appropriate types
      const processedCustomer = {
        name: customer.name || '',
        email: customer.email || null,
        phone: customer.phone || '',
        gender: customer.gender || 'male',
        city: customer.city || '',
        location_description: customer.location_description || null,
        national_id: customer.national_id || null,
        joined_date: customer.joined_date || new Date().toISOString(),
        loyalty_level: customer.loyalty_level || 'bronze',
        color_tag: customer.color_tag || 'normal',
        referred_by: customer.referred_by || null,
        total_spent: parseFloat(customer.total_spent) || 0,
        points: parseInt(customer.points) || 0,
        last_visit: customer.last_visit || new Date().toISOString(),
        is_active: customer.is_active === 'true' || customer.is_active === true,
        referrals: customer.referrals || '[]',
        whatsapp: customer.whatsapp || null,
        referral_source: customer.referral_source || null,
        birth_month: customer.birth_month || null,
        birth_day: customer.birth_day || null,
        customer_tag: customer.customer_tag || 'normal',
        notes: customer.notes || null,
        total_returns: parseInt(customer.total_returns) || 0,
        profile_image: customer.profile_image || null,
        initial_notes: customer.initial_notes || null,
        updated_at: new Date().toISOString()
      };

      // Update customer
      const { data, error } = await supabase
        .from('customers')
        .update(processedCustomer)
        .eq('id', customer.id);

      if (error) {
        console.error(`❌ Error updating customer ${customerNumber}:`, error);
        errorCount++;
        errors.push({ customer: customerNumber, id: customer.id, error: error.message });
      } else {
        updatedCount++;
      }

      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Exception updating customer ${customerNumber}:`, error);
      errorCount++;
      errors.push({ customer: customerNumber, id: customer.id, error: error.message });
    }
  }

  return { updatedCount, errorCount, errors };
}

// Main function
async function updateFromCSV() {
  try {
    console.log('🚀 Starting CSV to database update...');

    // Read CSV file
    const csvFilePath = '/Users/mtaasisi/Downloads/customers_update.csv';
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    console.log('📊 CSV file loaded successfully');

    // Parse CSV
    const customers = parseCSV(csvContent);
    console.log(`✅ Parsed ${customers.length} customers from CSV`);

    if (customers.length === 0) {
      console.log('❌ No customers found in CSV file');
      return;
    }

    // Update customers from CSV
    const result = await updateCustomersFromCSV(customers);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} customers`);
    console.log(`❌ Errors: ${result.errorCount} customers`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details (first 10):');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  Customer ${error.customer} (ID: ${error.id}): ${error.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting customers:', countError);
    } else {
      console.log(`📈 Total customers in database after update: ${count}`);
    }

    console.log('\n🎉 CSV to database update completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateFromCSV(); 