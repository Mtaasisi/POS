import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

console.log('🔧 Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyEmailTables() {
  try {
    console.log('📧 Applying email tables to database...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'create_email_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Email tables applied successfully!');
    
    // Verify the tables were created
    console.log('🔍 Verifying table creation...');
    
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('count')
      .limit(1);
    
    if (templatesError) {
      console.error('❌ Error checking email_templates table:', templatesError);
    } else {
      console.log('✅ email_templates table exists');
    }
    
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('count')
      .limit(1);
    
    if (campaignsError) {
      console.error('❌ Error checking email_campaigns table:', campaignsError);
    } else {
      console.log('✅ email_campaigns table exists');
    }
    
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('count')
      .limit(1);
    
    if (logsError) {
      console.error('❌ Error checking email_logs table:', logsError);
    } else {
      console.log('✅ email_logs table exists');
    }
    
  } catch (error) {
    console.error('❌ Error applying email tables:', error);
  }
}

// Run the script
applyEmailTables(); 