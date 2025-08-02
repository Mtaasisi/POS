import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlPath = './complete_customer_update.sql';
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('📊 Loading SQL file...');
console.log(`📈 File size: ${(sqlContent.length / 1024).toFixed(2)} KB`);

// Split the SQL into individual statements
const sqlStatements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`🔧 Found ${sqlStatements.length} SQL statements to execute`);

// Function to execute SQL statements
async function executeSqlStatements() {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log('🚀 Starting SQL execution...');

  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    const statementNumber = i + 1;
    const totalStatements = sqlStatements.length;

    try {
      console.log(`📦 Executing statement ${statementNumber}/${totalStatements}...`);
      
      // Execute the SQL statement
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${statementNumber}:`, error);
        errorCount++;
        errors.push({ statement: statementNumber, error: error.message });
      } else {
        successCount++;
        console.log(`✅ Statement ${statementNumber} executed successfully`);
      }

      // Add a small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Exception in statement ${statementNumber}:`, error);
      errorCount++;
      errors.push({ statement: statementNumber, error: error.message });
    }
  }

  return { successCount, errorCount, errors };
}

// Alternative approach: Execute the entire SQL as one statement
async function executeCompleteSql() {
  try {
    console.log('🚀 Executing complete SQL script...');
    
    // Remove comments and clean up the SQL
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    console.log(`📊 Executing SQL with ${cleanSql.length} characters...`);

    // Execute the complete SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: cleanSql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return { success: false, error: error.message };
    } else {
      console.log('✅ SQL executed successfully');
      return { success: true, data };
    }

  } catch (error) {
    console.error('❌ Exception executing SQL:', error);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log('🎯 Starting customer data update process...');

    // First, let's check current customer count
    console.log('\n🔍 Checking current database state...');
    const { count: currentCount, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting customers:', countError);
    } else {
      console.log(`📈 Current customers in database: ${currentCount}`);
    }

    // Try to execute the complete SQL
    const result = await executeCompleteSql();

    if (result.success) {
      console.log('\n✅ Customer update completed successfully!');
    } else {
      console.log('\n❌ Customer update failed:', result.error);
      
      // Fallback to individual statements
      console.log('\n🔄 Trying individual statements...');
      const statementResult = await executeSqlStatements();
      
      console.log('\n📊 Statement Execution Summary:');
      console.log(`✅ Successful statements: ${statementResult.successCount}`);
      console.log(`❌ Failed statements: ${statementResult.errorCount}`);
      
      if (statementResult.errors.length > 0) {
        console.log('\n❌ Error Details:');
        statementResult.errors.slice(0, 5).forEach(error => {
          console.log(`  Statement ${error.statement}: ${error.error}`);
        });
      }
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { count: newCount, error: newCountError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (newCountError) {
      console.error('❌ Error counting customers after update:', newCountError);
    } else {
      console.log(`📈 Customers in database after update: ${newCount}`);
      if (currentCount !== undefined) {
        const difference = newCount - currentCount;
        console.log(`📊 Change: ${difference > 0 ? '+' : ''}${difference} customers`);
      }
    }

    // Check for customers with birthdays
    const { data: birthdayCustomers, error: birthdayError } = await supabase
      .from('customers')
      .select('name, birth_month, birth_day')
      .not('birth_month', 'is', null)
      .limit(5);

    if (birthdayError) {
      console.error('❌ Error checking birthday customers:', birthdayError);
    } else {
      console.log('\n🎂 Sample customers with birthdays:');
      birthdayCustomers.forEach(customer => {
        console.log(`  ${customer.name}: ${customer.birth_month} ${customer.birth_day || ''}`);
      });
    }

    console.log('\n🎉 Customer update process completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 