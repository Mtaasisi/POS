import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixWhatsAppRLS() {
  console.log('🔧 Fixing WhatsApp auto-reply rules RLS policies...\n');

  try {
    // Drop existing restrictive policies
    console.log('🗑️ Dropping existing restrictive policies...');
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Admin can manage auto-reply rules" ON whatsapp_auto_reply_rules;
        DROP POLICY IF EXISTS "Admin can view messages" ON whatsapp_messages;
        DROP POLICY IF EXISTS "Admin can insert messages" ON whatsapp_messages;
      `
    });

    if (dropError) {
      console.log('⚠️ Could not drop existing policies:', dropError.message);
    } else {
      console.log('✅ Dropped existing restrictive policies');
    }

    // Create permissive policies for authenticated users
    console.log('🔐 Creating permissive policies for authenticated users...');
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Allow all authenticated users to manage auto-reply rules
        CREATE POLICY "Authenticated users can manage auto-reply rules" 
        ON whatsapp_auto_reply_rules 
        FOR ALL 
        TO authenticated 
        USING (true);

        -- Allow all authenticated users to view messages
        CREATE POLICY "Authenticated users can view messages" 
        ON whatsapp_messages 
        FOR SELECT 
        TO authenticated 
        USING (true);

        -- Allow all authenticated users to insert messages
        CREATE POLICY "Authenticated users can insert messages" 
        ON whatsapp_messages 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (true);

        -- Allow all authenticated users to update messages
        CREATE POLICY "Authenticated users can update messages" 
        ON whatsapp_messages 
        FOR UPDATE 
        TO authenticated 
        USING (true);
      `
    });

    if (createError) {
      console.error('❌ Error creating policies:', createError);
      return;
    }

    console.log('✅ Created permissive policies for authenticated users');

    // Verify the policies were created
    console.log('\n🔍 Verifying policies...');
    const { data: policies, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename IN ('whatsapp_auto_reply_rules', 'whatsapp_messages')
        ORDER BY tablename, policyname;
      `
    });

    if (verifyError) {
      console.error('❌ Error verifying policies:', verifyError);
    } else {
      console.log('📋 Current policies:');
      console.log(policies);
    }

    // Test inserting a rule
    console.log('\n🧪 Testing rule insertion...');
    const { data: testRule, error: testError } = await supabase
      .from('whatsapp_auto_reply_rules')
      .insert({
        trigger: 'test_trigger',
        response: 'test_response',
        enabled: true,
        case_sensitive: false,
        exact_match: false
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Test insertion failed:', testError);
    } else {
      console.log('✅ Test insertion successful:', testRule.id);
      
      // Clean up test rule
      await supabase
        .from('whatsapp_auto_reply_rules')
        .delete()
        .eq('id', testRule.id);
      console.log('🧹 Cleaned up test rule');
    }

    console.log('\n✅ WhatsApp RLS policies fixed successfully!');
    console.log('💡 You should now be able to add auto-reply rules in the UI.');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

fixWhatsAppRLS();
