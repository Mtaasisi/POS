import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAutomationRulesTable() {
  try {
    console.log('🔄 Creating automation_rules table...');
    
    // First, check if table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'automation_rules');
    
    if (checkError) {
      console.error('❌ Error checking existing tables:', checkError);
      return;
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ automation_rules table already exists!');
      
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
      return;
    }
    
    // Create the table using a simple approach
    console.log('📝 Creating automation_rules table...');
    
    // Insert some sample data to create the table structure
    const sampleRule = {
      name: 'Auto-approve small payments',
      description: 'Automatically approve payments under 100,000 TZS',
      type: 'payment_processing',
      status: 'active',
      conditions: [{ field: 'amount', operator: 'less_than', value: 100000 }],
      actions: [{ type: 'update_status', parameters: { status: 'approved' } }],
      priority: 1,
      execution_count: 0,
      created_by: '00000000-0000-0000-0000-000000000000' // Placeholder UUID
    };
    
    const { data, error } = await supabase
      .from('automation_rules')
      .insert([sampleRule]);
    
    if (error) {
      console.error('❌ Error creating table with sample data:', error);
      
      // If the table doesn't exist, we need to create it manually
      if (error.message.includes('relation "automation_rules" does not exist')) {
        console.log('🔧 Table does not exist. You may need to create it manually in the Supabase dashboard.');
        console.log('📋 SQL to create the table:');
        console.log(`
CREATE TABLE automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment_processing', 'fraud_detection', 'reconciliation', 'notification', 'compliance')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority INTEGER NOT NULL DEFAULT 0,
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view automation rules" ON automation_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert automation rules" ON automation_rules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update automation rules" ON automation_rules
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete automation rules" ON automation_rules
    FOR DELETE USING (auth.role() = 'authenticated');
        `);
      }
      return;
    }
    
    console.log('✅ automation_rules table created successfully!');
    console.log('📊 Sample rule inserted:', sampleRule.name);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
createAutomationRulesTable();
