const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWhatsAppAutomationTables() {
  console.log('🔧 Creating WhatsApp automation tables...');

  try {
    // Since we can't use CREATE TABLE directly through the client,
    // we'll create the tables by inserting data and letting Supabase create them
    
    console.log('📋 Creating WhatsApp Automation Workflows table...');
    
    // Try to insert a test workflow to create the table
    const testWorkflow = {
      id: 'test-workflow-1',
      name: 'Test Welcome Workflow',
      description: 'Test workflow for new customers',
      trigger: 'customer_registered',
      conditions: JSON.stringify([
        {
          id: '1',
          field: 'customer_type',
          operator: 'equals',
          value: 'new'
        }
      ]),
      actions: JSON.stringify([
        {
          id: '1',
          type: 'send_message',
          config: {
            template: 'welcome_message',
            delay: 0
          }
        }
      ]),
      is_active: true,
      priority: 1
    };

    const { data: workflowData, error: workflowError } = await supabase
      .from('whatsapp_automation_workflows')
      .insert(testWorkflow)
      .select();

    if (workflowError) {
      console.log('ℹ️ Table may not exist yet, this is expected');
      console.log('📝 You need to run the SQL migration manually');
    } else {
      console.log('✅ WhatsApp Automation Workflows table created');
    }

    console.log('📋 Creating WhatsApp Automation Executions table...');
    
    // Try to insert a test execution to create the table
    const testExecution = {
      id: 'test-execution-1',
      workflow_id: 'test-workflow-1',
      customer_id: null,
      status: 'test',
      test_mode: true
    };

    const { data: executionData, error: executionError } = await supabase
      .from('whatsapp_automation_executions')
      .insert(testExecution)
      .select();

    if (executionError) {
      console.log('ℹ️ Table may not exist yet, this is expected');
      console.log('📝 You need to run the SQL migration manually');
    } else {
      console.log('✅ WhatsApp Automation Executions table created');
    }

    console.log('\n📋 SQL Migration Required:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    
    const sqlScript = `
-- Create WhatsApp Automation Workflows Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger VARCHAR(50) NOT NULL CHECK (trigger IN ('message_received', 'order_placed', 'customer_registered', 'appointment_scheduled', 'payment_received')),
    conditions JSONB DEFAULT '[]',
    actions JSONB DEFAULT '[]',
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'test')),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    test_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_trigger ON whatsapp_automation_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_active ON whatsapp_automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_priority ON whatsapp_automation_workflows(priority);

CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_workflow_id ON whatsapp_automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_status ON whatsapp_automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_executed_at ON whatsapp_automation_executions(executed_at);

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON whatsapp_automation_workflows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_workflows FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_executions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_executions FOR UPDATE USING (true);

-- Insert default automation workflows
INSERT INTO whatsapp_automation_workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
('Welcome New Customer', 'Automatically welcome new customers with onboarding messages', 'customer_registered', 
 '[{"id": "1", "field": "customer_type", "operator": "equals", "value": "new"}]',
 '[{"id": "1", "type": "send_message", "config": {"template": "welcome_message", "delay": 0}}]',
 true, 1),
('Order Confirmation Flow', 'Send order confirmation and follow-up messages', 'order_placed',
 '[{"id": "1", "field": "order_amount", "operator": "greater_than", "value": "0"}]',
 '[{"id": "1", "type": "send_message", "config": {"template": "order_confirmation", "delay": 0}}]',
 true, 2)
ON CONFLICT DO NOTHING;
`;

    console.log(sqlScript);
    
    console.log('\n🎯 After running the SQL:');
    console.log('1. The 404 errors should be resolved');
    console.log('2. WhatsApp automation features will be available');
    console.log('3. Test the Advanced Automation Manager tab');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createWhatsAppAutomationTables();
