import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createQuickRepliesTable() {
  console.log('🔧 Creating quick_replies table...');

  try {
    // Create the quick_replies table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS quick_replies (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          category TEXT DEFAULT 'General',
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('❌ Error creating quick_replies table:', createError);
      return;
    }

    // Create indexes for better performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_quick_replies_user_id ON quick_replies(user_id);
        CREATE INDEX IF NOT EXISTS idx_quick_replies_category ON quick_replies(category);
        CREATE INDEX IF NOT EXISTS idx_quick_replies_sort_order ON quick_replies(sort_order);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return;
    }

    // Enable Row Level Security (RLS)
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }

    // Create RLS policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Policy for users to see only their own quick replies
        CREATE POLICY "Users can view their own quick replies" ON quick_replies
          FOR SELECT USING (auth.uid() = user_id);

        -- Policy for users to insert their own quick replies
        CREATE POLICY "Users can insert their own quick replies" ON quick_replies
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Policy for users to update their own quick replies
        CREATE POLICY "Users can update their own quick replies" ON quick_replies
          FOR UPDATE USING (auth.uid() = user_id);

        -- Policy for users to delete their own quick replies
        CREATE POLICY "Users can delete their own quick replies" ON quick_replies
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (policyError) {
      console.error('❌ Error creating RLS policies:', policyError);
      return;
    }

    // Add some default quick replies for testing
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Insert some default quick replies (these will be associated with a test user)
        -- You can modify these or remove this section if you don't want default data
        INSERT INTO quick_replies (user_id, text, category, sort_order) VALUES
          ('00000000-0000-0000-0000-000000000000', 'Hello! How can I help you today?', 'Greetings', 1),
          ('00000000-0000-0000-0000-000000000000', 'Thank you for your message. I''ll get back to you soon.', 'Responses', 1),
          ('00000000-0000-0000-0000-000000000000', 'Your order is being processed.', 'Orders', 1),
          ('00000000-0000-0000-0000-000000000000', 'We''re experiencing high volume. Please be patient.', 'Status', 1)
        ON CONFLICT DO NOTHING;
      `
    });

    if (insertError) {
      console.log('⚠️  Could not insert default data (this is normal if table already has data):', insertError.message);
    }

    console.log('✅ quick_replies table created successfully!');
    console.log('📋 Table structure:');
    console.log('   - id: UUID (Primary Key)');
    console.log('   - user_id: UUID (Foreign Key to auth.users)');
    console.log('   - text: TEXT (The quick reply text)');
    console.log('   - category: TEXT (Category for organization)');
    console.log('   - sort_order: INTEGER (For ordering)');
    console.log('   - created_at: TIMESTAMP');
    console.log('   - updated_at: TIMESTAMP');
    console.log('');
    console.log('🔒 Row Level Security enabled with policies for user isolation');
    console.log('📊 Indexes created for optimal performance');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createQuickRepliesTable().catch(console.error);
