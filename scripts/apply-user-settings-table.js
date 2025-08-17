const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUserSettingsTable() {
  try {
    console.log('🔧 Applying user_settings table to database...');

    // Create user_settings table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- User settings table
        CREATE TABLE IF NOT EXISTS user_settings (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL,
            settings JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
      `
    });

    if (createTableError) {
      console.error('❌ Error creating user_settings table:', createTableError);
      return;
    }

    console.log('✅ user_settings table created successfully');

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }

    console.log('✅ RLS enabled for user_settings table');

    // Create policy
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow users to manage their own settings" 
        ON user_settings FOR ALL 
        USING (auth.uid() = user_id);
      `
    });

    if (policyError) {
      console.error('❌ Error creating policy:', policyError);
      return;
    }

    console.log('✅ Policy created for user_settings table');

    // Create trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER update_user_settings_updated_at 
        BEFORE UPDATE ON user_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }

    console.log('✅ Trigger created for user_settings table');

    console.log('🎉 user_settings table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error applying user_settings table:', error);
  }
}

// Run the script
applyUserSettingsTable();
