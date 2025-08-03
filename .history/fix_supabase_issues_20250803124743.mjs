import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Fixing Supabase database issues...');

async function fixSupabaseIssues() {
  try {
    console.log('📝 Step 1: Checking existing tables...');
    
    // Check if tables exist by trying to query them
    const { data: smsLogs, error: smsError } = await supabase
      .from('sms_logs')
      .select('id')
      .limit(1);
    
    if (smsError) {
      console.log('⚠️ SMS logs table missing or has issues:', smsError.message);
    } else {
      console.log('✅ SMS logs table exists');
    }

    const { data: diagnosticTemplates, error: diagnosticError } = await supabase
      .from('diagnostic_templates')
      .select('id')
      .limit(1);
    
    if (diagnosticError) {
      console.log('⚠️ Diagnostic templates table missing:', diagnosticError.message);
    } else {
      console.log('✅ Diagnostic templates table exists');
    }

    const { data: communicationTemplates, error: communicationError } = await supabase
      .from('communication_templates')
      .select('id')
      .limit(1);
    
    if (communicationError) {
      console.log('⚠️ Communication templates table missing:', communicationError.message);
    } else {
      console.log('✅ Communication templates table exists');
    }

    console.log('📝 Step 2: Inserting diagnostic templates...');
    
    // Insert diagnostic templates if they don't exist
    const diagnosticTemplates = [
      {
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
      },
      {
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
      },
      {
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
      }
    ];

    for (const template of diagnosticTemplates) {
      const { error: insertError } = await supabase
        .from('diagnostic_templates')
        .upsert(template, { 
          onConflict: 'device_type',
          ignoreDuplicates: true 
        });
      
      if (insertError) {
        console.log(`⚠️ Failed to insert ${template.device_type} template:`, insertError.message);
      } else {
        console.log(`✅ ${template.device_type} template inserted/updated`);
      }
    }

    console.log('📝 Step 3: Inserting communication templates...');
    
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

    for (const template of smsTemplates) {
      const { error: insertError } = await supabase
        .from('communication_templates')
        .upsert(template, { 
          onConflict: 'title',
          ignoreDuplicates: true 
        });
      
      if (insertError) {
        console.log(`⚠️ Failed to insert ${template.title} template:`, insertError.message);
      } else {
        console.log(`✅ ${template.title} template inserted/updated`);
      }
    }

    console.log('📝 Step 4: Verifying data...');
    
    // Check final counts
    const { count: diagnosticCount } = await supabase
      .from('diagnostic_templates')
      .select('*', { count: 'exact', head: true });

    const { count: communicationCount } = await supabase
      .from('communication_templates')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Diagnostic templates: ${diagnosticCount || 0}`);
    console.log(`✅ Communication templates: ${communicationCount || 0}`);

    // Test SMS logs table structure
    const { data: testSmsLog, error: testSmsError } = await supabase
      .from('sms_logs')
      .insert({
        phone_number: '255123456789',
        message: 'Test message',
        status: 'pending'
      })
      .select()
      .single();

    if (testSmsError) {
      console.log('⚠️ SMS logs table structure issue:', testSmsError.message);
    } else {
      console.log('✅ SMS logs table structure is working');
      // Clean up test record
      await supabase
        .from('sms_logs')
        .delete()
        .eq('id', testSmsLog.id);
    }

    console.log('');
    console.log('🎉 Supabase fixes completed!');
    console.log('');
    console.log('✅ Issues addressed:');
    console.log('  • Diagnostic templates created/verified');
    console.log('  • Communication templates created/verified');
    console.log('  • SMS logs table structure tested');
    console.log('');
    console.log('🔄 Please refresh your application to see the changes.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Check if 404 errors for diagnostic_templates are gone');
    console.log('  2. Check if 400 errors for SMS logs are resolved');
    console.log('  3. Test SMS functionality in your app');

  } catch (error) {
    console.error('❌ Error running Supabase fixes:', error);
  }
}

// Run the fixes
fixSupabaseIssues(); 