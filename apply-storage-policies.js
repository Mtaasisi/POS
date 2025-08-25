// Apply storage RLS policies for product-images bucket
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyStoragePolicies() {
  console.log('🔧 Applying storage RLS policies for product-images bucket...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('setup-storage-policies.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip SELECT statements for now (we'll handle them separately)
      if (statement.trim().toUpperCase().startsWith('SELECT')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} result:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.log(`⚠️  Statement ${i + 1} failed:`, execError.message);
      }
    }

    console.log('\n🎉 Storage policies applied!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Test image upload through the UI');
    console.log('2. Check that images are stored in Supabase Storage');
    console.log('3. Verify that image URLs are accessible');

  } catch (error) {
    console.error('❌ Failed to apply storage policies:', error);
    
    console.log('\n💡 Alternative approach:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of setup-storage-policies.sql');
    console.log('4. Execute the SQL manually');
  }
}

// Run the policy application
applyStoragePolicies();
