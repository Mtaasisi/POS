import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFilePath = '/Users/mtaasisi/Downloads/customers_rows-2.sql';
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('📊 SQL file loaded successfully');

// Function to parse SQL INSERT statement and extract customer data
function parseSQLToCustomers(sqlContent) {
  const customers = [];
  
  // Extract the VALUES part from the SQL
  const valuesMatch = sqlContent.match(/VALUES\s*\((.*)\)/s);
  if (!valuesMatch) {
    console.error('❌ Could not find VALUES in SQL');
    return customers;
  }
  
  // Split by '), (' to get individual customer records
  const valuesString = valuesMatch[1];
  const customerStrings = valuesString.split(/\),\s*\(/);
  
  console.log(`📈 Found ${customerStrings.length} customer records to process`);
  
  customerStrings.forEach((customerString, index) => {
    try {
      // Clean up the string and split by comma
      const cleanString = customerString.replace(/^\(|\)$/g, ''); // Remove outer parentheses
      const values = parseCSVValues(cleanString);
      
      if (values.length >= 28) { // Ensure we have enough values
        const customer = {
          id: values[0].replace(/['"]/g, ''), // Remove quotes
          name: values[1].replace(/['"]/g, ''),
          email: values[2] === 'null' ? null : values[2].replace(/['"]/g, ''),
          phone: values[3].replace(/['"]/g, ''),
          gender: values[4].replace(/['"]/g, ''),
          city: values[5].replace(/['"]/g, ''),
          location_description: values[6] === 'null' ? null : values[6].replace(/['"]/g, ''),
          national_id: values[7] === 'null' ? null : values[7].replace(/['"]/g, ''),
          joined_date: values[8].replace(/['"]/g, ''),
          loyalty_level: values[9].replace(/['"]/g, ''),
          color_tag: values[10].replace(/['"]/g, ''),
          referred_by: values[11] === 'null' ? null : values[11].replace(/['"]/g, ''),
          total_spent: parseFloat(values[12].replace(/['"]/g, '')) || 0,
          points: parseInt(values[13].replace(/['"]/g, '')) || 0,
          last_visit: values[14].replace(/['"]/g, ''),
          is_active: values[15].replace(/['"]/g, '') === 'true',
          referrals: values[16] === 'null' ? '[]' : values[16].replace(/['"]/g, ''),
          whatsapp: values[17] === 'null' ? null : values[17].replace(/['"]/g, ''),
          referral_source: values[18] === 'null' ? null : values[18].replace(/['"]/g, ''),
          birth_month: values[19] === 'null' ? null : values[19].replace(/['"]/g, ''),
          birth_day: values[20] === 'null' ? null : values[20].replace(/['"]/g, ''),
          customer_tag: values[21].replace(/['"]/g, ''),
          notes: values[22] === 'null' ? null : values[22].replace(/['"]/g, ''),
          total_returns: parseInt(values[23].replace(/['"]/g, '')) || 0,
          profile_image: values[24] === 'null' ? null : values[24].replace(/['"]/g, ''),
          created_at: values[25].replace(/['"]/g, ''),
          updated_at: values[26].replace(/['"]/g, ''),
          initial_notes: values[27] === 'null' ? null : values[27].replace(/['"]/g, '')
        };
        
        customers.push(customer);
      }
    } catch (error) {
      console.error(`❌ Error parsing customer ${index + 1}:`, error.message);
    }
  });
  
  return customers;
}

// Function to parse CSV-like values from SQL
function parseCSVValues(csvString) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < csvString.length) {
    const char = csvString[i];
    
    if (char === "'" && (i === 0 || csvString[i-1] !== '\\')) {
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

// Function to update customers one by one
async function updateCustomersFromSQL(customers) {
  const totalCustomers = customers.length;
  let updatedCount = 0;
  let insertedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalCustomers} customers from SQL data`);

  for (let i = 0; i < totalCustomers; i++) {
    const customer = customers[i];
    const customerNumber = i + 1;

    if (customerNumber % 10 === 0) {
      console.log(`📦 Processing customer ${customerNumber}/${totalCustomers}`);
    }

    try {
      // First try to check if customer exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customer.id)
        .single();

      let result;
      if (existingCustomer) {
        // Update existing customer
        const { data, error } = await supabase
          .from('customers')
          .update({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            gender: customer.gender,
            city: customer.city,
            location_description: customer.location_description,
            national_id: customer.national_id,
            joined_date: customer.joined_date,
            loyalty_level: customer.loyalty_level,
            color_tag: customer.color_tag,
            referred_by: customer.referred_by,
            total_spent: customer.total_spent,
            points: customer.points,
            last_visit: customer.last_visit,
            is_active: customer.is_active,
            referrals: customer.referrals,
            whatsapp: customer.whatsapp,
            referral_source: customer.referral_source,
            birth_month: customer.birth_month,
            birth_day: customer.birth_day,
            customer_tag: customer.customer_tag,
            notes: customer.notes,
            total_returns: customer.total_returns,
            profile_image: customer.profile_image,
            initial_notes: customer.initial_notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);

        if (error) {
          errorCount++;
          errors.push({ customer: customerNumber, error: error.message });
        } else {
          updatedCount++;
        }
      } else {
        // Insert new customer
        const { data, error } = await supabase
          .from('customers')
          .insert({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            gender: customer.gender,
            city: customer.city,
            location_description: customer.location_description,
            national_id: customer.national_id,
            joined_date: customer.joined_date,
            loyalty_level: customer.loyalty_level,
            color_tag: customer.color_tag,
            referred_by: customer.referred_by,
            total_spent: customer.total_spent,
            points: customer.points,
            last_visit: customer.last_visit,
            is_active: customer.is_active,
            referrals: customer.referrals,
            whatsapp: customer.whatsapp,
            referral_source: customer.referral_source,
            birth_month: customer.birth_month,
            birth_day: customer.birth_day,
            customer_tag: customer.customer_tag,
            notes: customer.notes,
            total_returns: customer.total_returns,
            profile_image: customer.profile_image,
            initial_notes: customer.initial_notes,
            created_at: customer.created_at,
            updated_at: customer.updated_at
          });

        if (error) {
          errorCount++;
          errors.push({ customer: customerNumber, error: error.message });
        } else {
          insertedCount++;
        }
      }

      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Exception updating customer ${customerNumber}:`, error);
      errorCount++;
      errors.push({ customer: customerNumber, error: error.message });
    }
  }

  return { updatedCount, insertedCount, errorCount, errors };
}

// Main function
async function updateCustomersFromSQLFile() {
  try {
    console.log('🚀 Starting SQL to customer update process...');

    // Parse SQL to customer data
    const customers = parseSQLToCustomers(sqlContent);
    console.log(`✅ Parsed ${customers.length} customers from SQL`);

    if (customers.length === 0) {
      console.log('❌ No customers found in SQL file');
      return;
    }

    // Update customers from SQL data
    const result = await updateCustomersFromSQL(customers);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} customers`);
    console.log(`✅ Successfully inserted: ${result.insertedCount} customers`);
    console.log(`❌ Errors: ${result.errorCount} customers`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details (first 10):');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  Customer ${error.customer}: ${error.error}`);
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

    console.log('\n🎉 SQL to customer update process completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateCustomersFromSQLFile(); 