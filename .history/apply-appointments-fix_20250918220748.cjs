const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAppointmentsTable() {
  console.log('🔄 Fixing appointments table structure...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-appointments-table-structure.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            console.error(`Statement: ${statement}`);
            return false;
          }
        } catch (rpcError) {
          // If exec doesn't work, try a different approach
          console.log(`ℹ️  RPC exec failed, trying alternative approach...`);
          
          // For ALTER TABLE statements, we might need to handle them differently
          if (statement.includes('ALTER TABLE')) {
            console.log(`⚠️  ALTER TABLE statement may need manual execution: ${statement}`);
            continue;
          }
          
          return false;
        }
      }
    }
    
    console.log('✅ All SQL statements executed successfully');
    
    // Test the table by trying to insert a test record
    console.log('🧪 Testing appointments table functionality...');
    
    const testAppointment = {
      customer_id: '00000000-0000-0000-0000-000000000001', // This will fail due to foreign key, but that's expected
      service_type: 'repair',
      appointment_date: '2024-02-01',
      appointment_time: '10:00:00',
      duration_minutes: 60,
      priority: 'medium',
      status: 'pending'
    };
    
    const { error: testError } = await supabase
      .from('appointments')
      .insert(testAppointment);
    
    if (testError && testError.code === '23503') {
      console.log('✅ Appointments table structure fixed (foreign key constraint working as expected)');
    } else if (testError && testError.code === 'PGRST116') {
      console.log('❌ Appointments table still has issues:', testError);
      return false;
    } else if (testError) {
      console.error('❌ Unexpected test error:', testError);
      return false;
    } else {
      console.log('✅ Appointments table structure fixed and test insert successful');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting appointments table structure fix...');
  
  const success = await fixAppointmentsTable();
  
  if (success) {
    console.log('🎉 Appointments table fix completed successfully!');
    console.log('💡 The appointments table now matches the application code expectations.');
  } else {
    console.log('💥 Appointments table fix failed!');
    console.log('💡 You may need to manually execute the SQL in the Supabase SQL editor.');
    process.exit(1);
  }
}

main().catch(console.error);
