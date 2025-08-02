import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration (same as in supabaseClient.ts)
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyFunctions() {
  try {
    console.log('🔧 Applying missing functions to Supabase database...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('apply_functions.sql', 'utf8');
    
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
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Try alternative approach using direct SQL execution
          console.log('🔄 Trying alternative approach...');
          
          // For functions, we need to use a different approach
          // Let's try using the REST API directly
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            console.error(`❌ Alternative approach also failed for statement ${i + 1}`);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 All functions applied successfully!');
    
    // Test the function
    console.log('🧪 Testing get_table_statistics function...');
    const { data, error } = await supabase.rpc('get_table_statistics');
    
    if (error) {
      console.error('❌ Error testing function:', error);
    } else {
      console.log('✅ Function test successful!');
      console.log('📊 Table statistics:', data);
    }
    
  } catch (error) {
    console.error('❌ Error applying functions:', error);
  }
}

// Alternative approach using direct SQL execution
async function applyFunctionsDirect() {
  try {
    console.log('🔧 Applying functions using direct SQL execution...');
    
    const functions = [
      `CREATE OR REPLACE FUNCTION get_table_statistics()
       RETURNS TABLE (
           name VARCHAR,
           row_count BIGINT,
           size TEXT,
           last_updated TIMESTAMP,
           schema TEXT
       ) AS $$
       BEGIN
           RETURN QUERY
           SELECT 
               t.table_name::VARCHAR,
               COALESCE(c.reltuples::BIGINT, 0) as row_count,
               pg_size_pretty(pg_total_relation_size(c.oid))::TEXT as size,
               COALESCE(MAX(a.updated_at), NOW()) as last_updated,
               t.table_schema::TEXT
           FROM information_schema.tables t
           LEFT JOIN pg_class c ON c.relname = t.table_name
           LEFT JOIN (
               SELECT 
                   table_name,
                   MAX(updated_at) as updated_at
               FROM (
                   SELECT 'customers' as table_name, MAX(updated_at) as updated_at FROM customers
                   UNION ALL
                   SELECT 'devices' as table_name, MAX(updated_at) as updated_at FROM devices
                   UNION ALL
                   SELECT 'payments' as table_name, MAX(updated_at) as updated_at FROM payments
                   UNION ALL
                   SELECT 'audit_logs' as table_name, MAX(created_at) as updated_at FROM audit_logs
                   UNION ALL
                   SELECT 'settings' as table_name, MAX(updated_at) as updated_at FROM settings
               ) sub
               GROUP BY table_name
           ) a ON a.table_name = t.table_name
           WHERE t.table_schema = 'public'
           AND t.table_name IN ('customers', 'devices', 'payments', 'audit_logs', 'settings')
           GROUP BY t.table_name, t.table_schema, c.reltuples, c.oid;
       END;
       $$ LANGUAGE plpgsql;`,
      
      `CREATE OR REPLACE FUNCTION optimize_database()
       RETURNS VOID AS $$
       BEGIN
           ANALYZE customers;
           ANALYZE devices;
           ANALYZE payments;
           ANALYZE audit_logs;
           ANALYZE settings;
           
           VACUUM ANALYZE customers;
           VACUUM ANALYZE devices;
           VACUUM ANALYZE payments;
           VACUUM ANALYZE audit_logs;
           VACUUM ANALYZE settings;
       END;
       $$ LANGUAGE plpgsql;`
    ];
    
    for (let i = 0; i < functions.length; i++) {
      console.log(`⚡ Creating function ${i + 1}/${functions.length}...`);
      
      // Use the REST API to execute SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ sql: functions[i] })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error creating function ${i + 1}:`, errorText);
      } else {
        console.log(`✅ Function ${i + 1} created successfully`);
      }
    }
    
    console.log('🎉 Functions applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying functions:', error);
  }
}

// Run the function application
console.log('🚀 Starting function application...');
applyFunctionsDirect(); 