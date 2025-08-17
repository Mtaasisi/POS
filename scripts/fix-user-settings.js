import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserSettings() {
  try {
    console.log('🔧 Fixing user_settings table...');

    // First, let's check if the table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('📋 user_settings table does not exist, creating it...');
      
      // Since we can't use exec_sql, we'll create the table using the Supabase dashboard
      console.log('📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('');
      console.log('-- User settings table');
      console.log('CREATE TABLE IF NOT EXISTS user_settings (');
      console.log('    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,');
      console.log('    user_id UUID NOT NULL,');
      console.log('    settings JSONB NOT NULL DEFAULT \'{}\',');
      console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    UNIQUE(user_id)');
      console.log(');');
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Create policy for user settings');
      console.log('CREATE POLICY "Allow users to manage their own settings"');
      console.log('ON user_settings FOR ALL');
      console.log('USING (auth.uid() = user_id);');
      console.log('');
      console.log('-- Create trigger for updated_at column');
      console.log('CREATE TRIGGER update_user_settings_updated_at');
      console.log('BEFORE UPDATE ON user_settings');
      console.log('FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
      console.log('');
      
      console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql');
      console.log('📋 Copy and paste the SQL above, then click "Run"');
      console.log('✅ After running the SQL, the 406 errors should be resolved');
      
    } else if (checkError) {
      console.log('⚠️  Table exists but has RLS issues:', checkError.message);
      console.log('🔧 This might be a Row Level Security (RLS) policy issue');
      console.log('📝 Please check your RLS policies in the Supabase dashboard');
      
    } else {
      console.log('✅ user_settings table exists and is accessible');
    }

  } catch (error) {
    console.error('❌ Error checking user_settings table:', error);
  }
}

fixUserSettings();
