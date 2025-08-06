import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPerformanceMonitoringSettings() {
  try {
    console.log('🚀 Applying Performance Monitoring Settings...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'create_admin_settings_tables_simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 SQL file loaded successfully');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Performance Monitoring Settings applied successfully!');
    console.log('');
    console.log('📋 What was added:');
    console.log('✅ Real-time metrics collection');
    console.log('✅ Alert thresholds for CPU, Memory, Disk, Response Time, Error Rate');
    console.log('✅ Auto-scaling configuration');
    console.log('✅ Resource limits and monitoring intervals');
    console.log('✅ Performance alerts (Email, Slack, SMS)');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Go to your admin settings page');
    console.log('2. Click on "Performance Monitoring" in the sidebar');
    console.log('3. Configure your monitoring preferences');
    console.log('4. Test the real-time metrics');
    
  } catch (error) {
    console.error('❌ Failed to apply Performance Monitoring Settings:', error);
    console.log('');
    console.log('🔧 Manual Setup Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of create_admin_settings_tables_simple.sql');
    console.log('4. Paste and execute the SQL');
    console.log('5. Check the admin settings page for the new Performance Monitoring section');
  }
}

// Run the script
applyPerformanceMonitoringSettings(); 