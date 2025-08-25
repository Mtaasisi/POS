import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixWhatsAppInstancesRLS() {
  console.log('🔧 Fixing WhatsApp instances RLS policies...\n');

  try {
    // Drop existing restrictive policies
    console.log('🗑️ Dropping existing restrictive policies...');
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own WhatsApp instances" ON whatsapp_instances;',
      'DROP POLICY IF EXISTS "Users can insert their own WhatsApp instances" ON whatsapp_instances;',
      'DROP POLICY IF EXISTS "Users can update their own WhatsApp instances" ON whatsapp_instances;',
      'DROP POLICY IF EXISTS "Users can delete their own WhatsApp instances" ON whatsapp_instances;'
    ];

    for (const policy of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log('⚠️ Could not drop policy:', error.message);
      }
    }

    console.log('✅ Dropped existing restrictive policies');

    // Create permissive policies for authenticated users
    console.log('🔐 Creating permissive policies for authenticated users...');
    
    const createPolicies = [
      `CREATE POLICY "Authenticated users can view WhatsApp instances" 
       ON whatsapp_instances FOR SELECT 
       TO authenticated 
       USING (true);`,
      
      `CREATE POLICY "Authenticated users can insert WhatsApp instances" 
       ON whatsapp_instances FOR INSERT 
       TO authenticated 
       WITH CHECK (true);`,
      
      `CREATE POLICY "Authenticated users can update WhatsApp instances" 
       ON whatsapp_instances FOR UPDATE 
       TO authenticated 
       USING (true);`,
      
      `CREATE POLICY "Authenticated users can delete WhatsApp instances" 
       ON whatsapp_instances FOR DELETE 
       TO authenticated 
       USING (true);`,
      
      `CREATE POLICY "Admin users have full access to WhatsApp instances" 
       ON whatsapp_instances FOR ALL 
       TO authenticated 
       USING (
           EXISTS (
               SELECT 1 FROM auth.users 
               WHERE auth.users.id = auth.uid() 
               AND auth.users.raw_user_meta_data->>'role' = 'admin'
           )
       );`
    ];

    for (const policy of createPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.error('❌ Error creating policy:', error);
      } else {
        console.log('✅ Created policy successfully');
      }
    }

    console.log('✅ Created permissive policies for authenticated users');

    // Test the connection
    console.log('\n🧪 Testing connection to whatsapp_instances table...');
    const { data: testData, error: testError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test successful - can access whatsapp_instances table');
      console.log('📊 Found', testData?.length || 0, 'instances');
    }

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
        WHERE tablename = 'whatsapp_instances'
        ORDER BY policyname;
      `
    });

    if (verifyError) {
      console.error('❌ Error verifying policies:', verifyError);
    } else {
      console.log('📋 Current policies for whatsapp_instances:');
      console.log(policies);
    }

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

// Run the fix
fixWhatsAppInstancesRLS();
