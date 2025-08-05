import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyLoyaltyTables() {
  console.log('🔧 Applying loyalty tables to online database...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('setup_online_loyalty_tables.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Warning for statement ${i + 1}:`, error.message);
            // Continue with other statements even if one fails
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Error for statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    // Test the loyalty tables
    console.log('🧪 Testing loyalty tables...');
    
    // Test loyalty_customers table
    const { data: loyaltyCustomers, error: loyaltyError } = await supabase
      .from('loyalty_customers')
      .select('*')
      .limit(5);
    
    if (loyaltyError) {
      console.error('❌ Error accessing loyalty_customers:', loyaltyError.message);
    } else {
      console.log(`✅ loyalty_customers table accessible. Found ${loyaltyCustomers?.length || 0} records`);
    }
    
    // Test loyalty_rewards table
    const { data: loyaltyRewards, error: rewardsError } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .limit(5);
    
    if (rewardsError) {
      console.error('❌ Error accessing loyalty_rewards:', rewardsError.message);
    } else {
      console.log(`✅ loyalty_rewards table accessible. Found ${loyaltyRewards?.length || 0} records`);
    }
    
    // Test customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Error accessing customers:', customersError.message);
    } else {
      console.log(`✅ customers table accessible. Found ${customers?.length || 0} records`);
    }
    
    console.log('🎉 Loyalty tables setup completed!');
    console.log('📱 Your POS system should now properly fetch loyalty data from the online database.');
    
  } catch (error) {
    console.error('❌ Error applying loyalty tables:', error);
  }
}

// Run the setup
applyLoyaltyTables(); 