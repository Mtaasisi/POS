import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointmentsSchema() {
  console.log('🔍 Checking appointments table schema...');
  
  try {
    // Get table information by querying information_schema
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'appointments')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('❌ Error getting schema:', error);
      return;
    }
    
    console.log('📋 Appointments table columns:');
    columns?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check foreign key relationships
    console.log('\n🔗 Checking foreign key relationships...');
    const { data: fks, error: fkError } = await supabase
      .from('information_schema.key_column_usage')
      .select('column_name, referenced_table_name, referenced_column_name')
      .eq('table_name', 'appointments')
      .eq('table_schema', 'public')
      .not('referenced_table_name', 'is', null);
    
    if (fkError) {
      console.log('❌ Error getting foreign keys:', fkError);
    } else {
      console.log('🔗 Foreign key relationships:');
      fks?.forEach(fk => {
        console.log(`  - ${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    }
    
    // Try a simple query to see what data exists
    console.log('\n📊 Sample data:');
    const { data: sample, error: sampleError } = await supabase
      .from('appointments')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.log('❌ Error getting sample data:', sampleError);
    } else {
      console.log('Sample appointments:', sample);
    }
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

checkAppointmentsSchema();
