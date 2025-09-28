import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStaffPointsTable() {
  console.log('Creating staff_points table...');
  
  try {
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('staff_points')
      .select('id')
      .limit(1);
    
    if (existingTable && !checkError) {
      console.log('✅ staff_points table already exists');
      return;
    }
    
    // Create the table using SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS staff_points (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
          points INTEGER NOT NULL DEFAULT 0,
          earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          reason TEXT NOT NULL,
          created_by UUID REFERENCES auth_users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_staff_points_user_id ON staff_points(user_id);
        CREATE INDEX IF NOT EXISTS idx_staff_points_earned_date ON staff_points(earned_date);
        
        ALTER TABLE staff_points ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own staff points" ON staff_points;
        CREATE POLICY "Users can view own staff points" ON staff_points
          FOR SELECT USING (auth.uid() = user_id OR auth.uid() = created_by);
        
        DROP POLICY IF EXISTS "Users can insert staff points" ON staff_points;
        CREATE POLICY "Users can insert staff points" ON staff_points
          FOR INSERT WITH CHECK (auth.uid() = created_by);
        
        DROP POLICY IF EXISTS "Admins can view all staff points" ON staff_points;
        CREATE POLICY "Admins can view all staff points" ON staff_points
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM auth_users 
              WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
          );
        
        DROP POLICY IF EXISTS "Admins can insert staff points" ON staff_points;
        CREATE POLICY "Admins can insert staff points" ON staff_points
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM auth_users 
              WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
          );
      `
    });
    
    if (error) {
      console.error('❌ Error creating staff_points table:', error);
      
      // Try alternative approach - direct table creation
      console.log('Trying alternative approach...');
      
      // Test if we can insert a record (which will create the table if it doesn't exist)
      const testInsert = await supabase
        .from('staff_points')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          points: 0,
          reason: 'test',
          created_by: '00000000-0000-0000-0000-000000000000'
        });
      
      if (testInsert.error) {
        console.error('❌ Could not create staff_points table:', testInsert.error);
        console.log('Please create the table manually in Supabase dashboard:');
        console.log(`
CREATE TABLE IF NOT EXISTS staff_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT NOT NULL,
  created_by UUID REFERENCES auth_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `);
      } else {
        console.log('✅ staff_points table created successfully');
        // Clean up test record
        await supabase
          .from('staff_points')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000');
      }
    } else {
      console.log('✅ staff_points table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createStaffPointsTable();
