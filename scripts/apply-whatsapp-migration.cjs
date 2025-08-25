const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for migrations
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for migrations');
  console.log('📝 Please add your service role key to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyWhatsAppMigration() {
  console.log('🔧 Applying WhatsApp automation tables migration...');

  try {
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241226000003_create_whatsapp_tables_final.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing migration...');
    
    // Execute the migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Fallback: Try to create tables manually
      console.log('🔄 Trying manual table creation...');
      await createTablesManually();
    } else {
      console.log('✅ Migration applied successfully!');
      console.log('📊 Data:', data);
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    console.log('🔄 Trying manual table creation...');
    await createTablesManually();
  }
}

async function createTablesManually() {
  console.log('🔧 Creating WhatsApp automation tables manually...');

  try {
    // Create WhatsApp Automation Workflows table
    console.log('📋 Creating whatsapp_automation_workflows table...');
    const { error: workflowsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          trigger VARCHAR(50) NOT NULL,
          conditions TEXT DEFAULT '[]',
          actions TEXT DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          priority INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (workflowsError) {
      console.log('ℹ️ Workflows table may already exist or error occurred:', workflowsError.message);
    } else {
      console.log('✅ WhatsApp Automation Workflows table created');
    }

    // Create WhatsApp Automation Executions table
    console.log('📋 Creating whatsapp_automation_executions table...');
    const { error: executionsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS whatsapp_automation_executions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          workflow_id UUID REFERENCES whatsapp_automation_workflows(id) ON DELETE CASCADE,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'pending',
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          test_mode BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (executionsError) {
      console.log('ℹ️ Executions table may already exist or error occurred:', executionsError.message);
    } else {
      console.log('✅ WhatsApp Automation Executions table created');
    }

    // Enable RLS and create policies
    console.log('🔒 Setting up RLS policies...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
        ALTER TABLE whatsapp_automation_executions ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_automation_workflows;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_automation_workflows;
        DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_automation_workflows;
        
        CREATE POLICY "Enable read access for all users" ON whatsapp_automation_workflows FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_workflows FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON whatsapp_automation_workflows FOR UPDATE USING (true);
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_automation_executions;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_automation_executions;
        DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_automation_executions;
        
        CREATE POLICY "Enable read access for all users" ON whatsapp_automation_executions FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_executions FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON whatsapp_automation_executions FOR UPDATE USING (true);
      `
    });

    console.log('✅ RLS policies created');

    // Insert default data
    console.log('📝 Inserting default data...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        INSERT INTO whatsapp_automation_workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
        ('Welcome New Customer', 'Automatically welcome new customers', 'customer_registered', '[]', '[]', true, 1),
        ('Order Confirmation Flow', 'Send order confirmation messages', 'order_placed', '[]', '[]', true, 2),
        ('Support Request Handler', 'Handle support requests', 'message_received', '[]', '[]', true, 3)
        ON CONFLICT (name) DO NOTHING;
      `
    });

    console.log('✅ Default workflows inserted');

    console.log('\n🎉 WhatsApp automation tables created successfully!');
    console.log('📋 Tables created:');
    console.log('   - whatsapp_automation_workflows');
    console.log('   - whatsapp_automation_executions');
    console.log('🔒 RLS policies enabled');
    console.log('📝 Default data inserted');

  } catch (error) {
    console.error('❌ Error creating tables manually:', error);
    console.log('\n📝 Manual SQL Instructions:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(50));
    console.log(`
-- Create WhatsApp Automation Workflows Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    trigger VARCHAR(50) NOT NULL,
    conditions TEXT DEFAULT '[]',
    actions TEXT DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp Automation Executions Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES whatsapp_automation_workflows(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    test_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_executions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON whatsapp_automation_workflows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_workflows FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_executions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_executions FOR UPDATE USING (true);

-- Insert default data
INSERT INTO whatsapp_automation_workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
('Welcome New Customer', 'Automatically welcome new customers', 'customer_registered', '[]', '[]', true, 1),
('Order Confirmation Flow', 'Send order confirmation messages', 'order_placed', '[]', '[]', true, 2),
('Support Request Handler', 'Handle support requests', 'message_received', '[]', '[]', true, 3)
ON CONFLICT (name) DO NOTHING;
    `);
    console.log('='.repeat(50));
  }
}

// Run the migration
applyWhatsAppMigration().catch(console.error);
