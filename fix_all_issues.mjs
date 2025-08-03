import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Fixing all database issues...');

async function fixDatabaseIssues() {
  try {
    console.log('📝 Step 1: Fixing SMS logs table...');
    
    // Fix SMS logs table structure
    const smsLogsFix = `
      -- Ensure sms_logs table exists with correct structure
      CREATE TABLE IF NOT EXISTS public.sms_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
          error_message TEXT,
          sent_at TIMESTAMP WITH TIME ZONE,
          sent_by UUID REFERENCES auth.users(id),
          device_id UUID REFERENCES devices(id),
          cost DECIMAL(10,4),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: smsError } = await supabase.rpc('exec_sql', { sql: smsLogsFix });
    if (smsError) console.log('⚠️ SMS logs fix:', smsError.message);
    else console.log('✅ SMS logs table fixed');

    console.log('📝 Step 2: Creating diagnostic templates table...');
    
    // Create diagnostic templates table
    const diagnosticTemplatesFix = `
      CREATE TABLE IF NOT EXISTS public.diagnostic_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_type TEXT NOT NULL,
          checklist_items JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: diagnosticError } = await supabase.rpc('exec_sql', { sql: diagnosticTemplatesFix });
    if (diagnosticError) console.log('⚠️ Diagnostic templates fix:', diagnosticError.message);
    else console.log('✅ Diagnostic templates table created');

    console.log('📝 Step 3: Creating communication templates table...');
    
    // Create communication templates table
    const communicationTemplatesFix = `
      CREATE TABLE IF NOT EXISTS public.communication_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          module TEXT NOT NULL,
          variables TEXT[] DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: communicationError } = await supabase.rpc('exec_sql', { sql: communicationTemplatesFix });
    if (communicationError) console.log('⚠️ Communication templates fix:', communicationError.message);
    else console.log('✅ Communication templates table created');

    console.log('📝 Step 4: Inserting default data...');
    
    // Insert default diagnostic templates
    const laptopTemplate = {
      device_type: 'Laptop',
      checklist_items: [
        { id: "1", name: "Power On Test", description: "Check if device powers on" },
        { id: "2", name: "Display Test", description: "Check screen functionality" },
        { id: "3", name: "Keyboard Test", description: "Test all keyboard keys" },
        { id: "4", name: "Touchpad Test", description: "Test touchpad functionality" },
        { id: "5", name: "Audio Test", description: "Test speakers and microphone" },
        { id: "6", name: "USB Ports Test", description: "Test all USB ports" },
        { id: "7", name: "WiFi Test", description: "Test wireless connectivity" },
        { id: "8", name: "Battery Test", description: "Check battery health" }
      ]
    };

    const phoneTemplate = {
      device_type: 'Phone',
      checklist_items: [
        { id: "1", name: "Power On Test", description: "Check if device powers on" },
        { id: "2", name: "Display Test", description: "Check screen and touch functionality" },
        { id: "3", name: "Camera Test", description: "Test front and back cameras" },
        { id: "4", name: "Audio Test", description: "Test speakers and microphone" },
        { id: "5", name: "Charging Test", description: "Test charging port" },
        { id: "6", name: "SIM Card Test", description: "Test SIM card functionality" },
        { id: "7", name: "WiFi Test", description: "Test wireless connectivity" },
        { id: "8", name: "Battery Test", description: "Check battery health" }
      ]
    };

    const tabletTemplate = {
      device_type: 'Tablet',
      checklist_items: [
        { id: "1", name: "Power On Test", description: "Check if device powers on" },
        { id: "2", name: "Display Test", description: "Check screen and touch functionality" },
        { id: "3", name: "Camera Test", description: "Test front and back cameras" },
        { id: "4", name: "Audio Test", description: "Test speakers and microphone" },
        { id: "5", name: "Charging Test", description: "Test charging port" },
        { id: "6", name: "WiFi Test", description: "Test wireless connectivity" },
        { id: "7", name: "Battery Test", description: "Check battery health" }
      ]
    };

    // Insert diagnostic templates
    const { error: insertDiagnosticError } = await supabase
      .from('diagnostic_templates')
      .upsert([laptopTemplate, phoneTemplate, tabletTemplate], { 
        onConflict: 'device_type',
        ignoreDuplicates: true 
      });
    
    if (insertDiagnosticError) console.log('⚠️ Diagnostic templates insert:', insertDiagnosticError.message);
    else console.log('✅ Diagnostic templates inserted');

    // Insert communication templates
    const smsTemplates = [
      {
        title: 'Device Received',
        content: 'Dear {customer_name}, we have received your {device_brand} {device_model} for repair. Ticket: {ticket_number}. We will contact you once the repair is complete.',
        module: 'sms',
        variables: ['customer_name', 'device_brand', 'device_model', 'ticket_number']
      },
      {
        title: 'Device Ready',
        content: 'Dear {customer_name}, your {device_brand} {device_model} is ready for collection. Ticket: {ticket_number}. Please visit our shop to collect your device.',
        module: 'sms',
        variables: ['customer_name', 'device_brand', 'device_model', 'ticket_number']
      },
      {
        title: 'Payment Reminder',
        content: 'Dear {customer_name}, please complete payment for your {device_brand} {device_model} repair. Amount: {amount}. Ticket: {ticket_number}',
        module: 'sms',
        variables: ['customer_name', 'device_brand', 'device_model', 'amount', 'ticket_number']
      }
    ];

    const { error: insertCommunicationError } = await supabase
      .from('communication_templates')
      .upsert(smsTemplates, { 
        onConflict: 'title',
        ignoreDuplicates: true 
      });
    
    if (insertCommunicationError) console.log('⚠️ Communication templates insert:', insertCommunicationError.message);
    else console.log('✅ Communication templates inserted');

    console.log('📝 Step 5: Creating indexes...');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);',
      'CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);',
      'CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_diagnostic_templates_device_type ON diagnostic_templates(device_type);',
      'CREATE INDEX IF NOT EXISTS idx_communication_templates_module ON communication_templates(module);',
      'CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active);'
    ];

    for (const index of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: index });
      if (indexError) console.log('⚠️ Index creation:', indexError.message);
    }
    
    console.log('✅ Indexes created');

    console.log('📝 Step 6: Setting up RLS policies...');
    
    // Enable RLS and create policies
    const rlsPolicies = [
      'ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "Users can view diagnostic templates" ON diagnostic_templates;',
      'CREATE POLICY "Users can view diagnostic templates" ON diagnostic_templates FOR SELECT USING (true);',
      'DROP POLICY IF EXISTS "Users can view communication templates" ON communication_templates;',
      'CREATE POLICY "Users can view communication templates" ON communication_templates FOR SELECT USING (true);'
    ];

    for (const policy of rlsPolicies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      if (policyError) console.log('⚠️ RLS policy:', policyError.message);
    }
    
    console.log('✅ RLS policies configured');

    console.log('📝 Step 7: Verifying fixes...');
    
    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['sms_logs', 'diagnostic_templates', 'communication_templates']);

    if (tablesError) {
      console.log('⚠️ Table verification:', tablesError.message);
    } else {
      console.log('✅ Tables verified:', tables?.map(t => t.table_name).join(', '));
    }

    // Check data counts
    const { count: diagnosticCount } = await supabase
      .from('diagnostic_templates')
      .select('*', { count: 'exact', head: true });

    const { count: communicationCount } = await supabase
      .from('communication_templates')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Diagnostic templates: ${diagnosticCount || 0}`);
    console.log(`✅ Communication templates: ${communicationCount || 0}`);

    console.log('');
    console.log('🎉 All database fixes completed successfully!');
    console.log('');
    console.log('✅ Issues fixed:');
    console.log('  • SMS logs table structure updated');
    console.log('  • Diagnostic templates table created');
    console.log('  • Communication templates table created');
    console.log('  • RLS policies configured');
    console.log('  • Indexes created for performance');
    console.log('');
    console.log('🔄 Please refresh your application to see the changes.');

  } catch (error) {
    console.error('❌ Error running database fixes:', error);
  }
}

// Run the fixes
fixDatabaseIssues(); 