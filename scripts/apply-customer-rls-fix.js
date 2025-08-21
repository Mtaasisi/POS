import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCustomerRLSFix() {
  console.log('🔧 Applying Customer RLS Policies Fix...');
  console.log('📋 This will fix potential 400 Bad Request errors when fetching customer data\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241203000007_fix_customer_rls_policies.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded successfully');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');

    console.log(`🔧 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      try {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.log(`⚠️ Statement ${i + 1} had an issue:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️ Exception in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }

    console.log('\n🎉 RLS migration application completed!');
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    await testCustomerQuery();

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

async function testCustomerQuery() {
  console.log('🔍 Testing customer query after RLS fix...');
  
  try {
    // Test the complex query that was failing
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, total_returns, profile_image, created_at, updated_at,
        customer_notes(*),
        customer_payments(
          *,
          devices(brand, model)
        ),
        promo_messages(*),
        devices(*)
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ Test query still failing:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Test query succeeded!');
      console.log(`📊 Retrieved ${data?.length || 0} customers with all related data`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

// Run the migration
applyCustomerRLSFix().then(() => {
  console.log('\n🏁 Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});
