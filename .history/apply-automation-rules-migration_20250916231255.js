import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAutomationRulesMigration() {
  try {
    console.log('🔄 Applying automation_rules table migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-automation-rules-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Automation rules table migration applied successfully!');
    
    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'automation_rules');
    
    if (tableError) {
      console.error('❌ Error verifying table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ automation_rules table verified successfully!');
      
      // Check if we have any rules
      const { data: rules, error: rulesError } = await supabase
        .from('automation_rules')
        .select('id, name, type, status')
        .limit(5);
      
      if (rulesError) {
        console.error('❌ Error checking rules:', rulesError);
      } else {
        console.log(`📊 Found ${rules?.length || 0} automation rules in the table`);
        if (rules && rules.length > 0) {
          console.log('📋 Sample rules:');
          rules.forEach(rule => {
            console.log(`   - ${rule.name} (${rule.type}, ${rule.status})`);
          });
        }
      }
    } else {
      console.error('❌ automation_rules table not found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyAutomationRulesMigration();
