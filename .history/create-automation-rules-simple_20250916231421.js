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
    
    // First, try to check if table already exists by querying it
    console.log('🔍 Checking if automation_rules table exists...');
    
    const { data: existingRules, error: checkError } = await supabase
      .from('automation_rules')
      .select('id, name, type, status')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ automation_rules table already exists!');
      
      // Get count of existing rules
      const { data: allRules, error: countError } = await supabase
        .from('automation_rules')
        .select('id, name, type, status')
        .limit(10);
      
      if (!countError) {
        console.log(`📊 Found ${allRules?.length || 0} automation rules in the table`);
        if (allRules && allRules.length > 0) {
          console.log('📋 Sample rules:');
          allRules.forEach(rule => {
            console.log(`   - ${rule.name} (${rule.type}, ${rule.status})`);
          });
        }
      }
      return;
    }
    
    if (checkError && !checkError.message.includes('relation "automation_rules" does not exist')) {
      console.error('❌ Error checking table:', checkError);
      return;
    }
    
    console.log('🔧 automation_rules table does not exist. Please create it manually in the Supabase dashboard.');
    console.log('');
    console.log('📋 Copy and paste this SQL into the Supabase SQL Editor:');
    console.log('');
    console.log('-- Create automation_rules table');
    console.log('CREATE TABLE automation_rules (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    name VARCHAR(255) NOT NULL,');
    console.log('    description TEXT,');
    console.log('    type VARCHAR(50) NOT NULL CHECK (type IN (\'payment_processing\', \'fraud_detection\', \'reconciliation\', \'notification\', \'compliance\')),');
    console.log('    status VARCHAR(20) NOT NULL DEFAULT \'draft\' CHECK (status IN (\'active\', \'inactive\', \'draft\')),');
    console.log('    conditions JSONB NOT NULL DEFAULT \'[]\'::jsonb,');
    console.log('    actions JSONB NOT NULL DEFAULT \'[]\'::jsonb,');
    console.log('    priority INTEGER NOT NULL DEFAULT 0,');
    console.log('    execution_count INTEGER NOT NULL DEFAULT 0,');
    console.log('    last_executed TIMESTAMP WITH TIME ZONE,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    created_by UUID,');
    console.log('    updated_by UUID');
    console.log(');');
    console.log('');
    console.log('-- Enable RLS');
    console.log('ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Create RLS policies');
    console.log('CREATE POLICY "Users can view automation rules" ON automation_rules');
    console.log('    FOR SELECT USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('CREATE POLICY "Users can insert automation rules" ON automation_rules');
    console.log('    FOR INSERT WITH CHECK (auth.role() = \'authenticated\');');
    console.log('');
    console.log('CREATE POLICY "Users can update automation rules" ON automation_rules');
    console.log('    FOR UPDATE USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('CREATE POLICY "Users can delete automation rules" ON automation_rules');
    console.log('    FOR DELETE USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('-- Insert sample automation rules');
    console.log('INSERT INTO automation_rules (name, description, type, status, conditions, actions, priority) VALUES');
    console.log('(\'Auto-approve small payments\', \'Automatically approve payments under 100,000 TZS\', \'payment_processing\', \'active\', \'[{"field": "amount", "operator": "less_than", "value": 100000}]\'::jsonb, \'[{"type": "update_status", "parameters": {"status": "approved"}}]\'::jsonb, 1),');
    console.log('(\'Flag large payments\', \'Flag payments over 1,000,000 TZS for manual review\', \'fraud_detection\', \'active\', \'[{"field": "amount", "operator": "greater_than", "value": 1000000}]\'::jsonb, \'[{"type": "create_alert", "parameters": {"alert_type": "large_payment", "message": "Large payment requires review"}}]\'::jsonb, 2),');
    console.log('(\'Daily reconciliation reminder\', \'Send daily reminder for payment reconciliation\', \'notification\', \'active\', \'[{"field": "time", "operator": "equals", "value": "daily"}]\'::jsonb, \'[{"type": "send_notification", "parameters": {"type": "email", "template": "daily_reconciliation"}}]\'::jsonb, 3);');
    console.log('');
    console.log('✅ After running this SQL, the automation_rules table will be created and the 404 errors will be resolved.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
createAutomationRulesTable();
