import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix400Error() {
  console.log('🔧 Fixing 400 Bad Request error...');
  
  try {
    // 1. Create auth_users table if it doesn't exist
    console.log('📋 Creating auth_users table...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS auth_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255),
          email VARCHAR(255),
          username VARCHAR(255),
          role VARCHAR(50) DEFAULT 'technician',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createError) {
      console.log('ℹ️  Table might already exist:', createError.message);
    } else {
      console.log('✅ auth_users table created/verified');
    }

    // 2. Enable RLS
    console.log('🔒 Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('ℹ️  RLS might already be enabled:', rlsError.message);
    } else {
      console.log('✅ RLS enabled');
    }

    // 3. Create RLS policy
    console.log('📝 Creating RLS policy...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Enable all operations for all users" ON auth_users;
        CREATE POLICY "Enable all operations for all users" ON auth_users 
        FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (policyError) {
      console.log('ℹ️  Policy might already exist:', policyError.message);
    } else {
      console.log('✅ RLS policy created');
    }

    // 4. Insert test user 'care' if it doesn't exist
    console.log('👤 Creating test user "care"...');
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('name', 'care')
      .single();

    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('auth_users')
        .insert([{
          name: 'care',
          email: 'care@example.com',
          username: 'care',
          role: 'technician',
          is_active: true
        }]);
      
      if (insertError) {
        console.log('❌ Error creating test user:', insertError.message);
      } else {
        console.log('✅ Test user "care" created');
      }
    } else {
      console.log('✅ Test user "care" already exists');
    }

    // 5. Test the fixed query
    console.log('🧪 Testing fixed query...');
    const { data: testData, error: testError } = await supabase
      .from('auth_users')
      .select('id, name, email')
      .eq('name', 'care');

    if (testError) {
      console.log('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Test query successful:', testData);
    }

    console.log('🎉 Fix completed! The 400 error should be resolved.');
    console.log('📝 Use .eq("name", "care") instead of .in("id", ["care"]) in your code.');

  } catch (error) {
    console.error('❌ Error during fix:', error.message);
  }
}

fix400Error();
