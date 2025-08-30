import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyIsPrimaryMigration() {
  console.log('🔧 Applying is_primary column migration...');
  
  try {
    // Check if column already exists by trying to select it
    const { data: testData, error: columnError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('is_primary')
      .limit(1);
    
    if (columnError) {
      console.error('❌ Error checking column existence:', columnError);
      return;
    }
    
    const columnExists = !columnError || !columnError.message?.includes('does not exist');
    console.log(`📋 is_primary column exists: ${columnExists}`);
    
    if (columnError && columnError.message?.includes('does not exist')) {
      console.log('➕ Adding is_primary column...');
      
      const migrationSQL = `
        -- Add the is_primary column
        ALTER TABLE whatsapp_instances_comprehensive 
        ADD COLUMN is_primary BOOLEAN DEFAULT false;

        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_is_primary 
        ON whatsapp_instances_comprehensive(is_primary);

        -- Create function to ensure only one primary instance per user
        CREATE OR REPLACE FUNCTION ensure_single_primary_whatsapp_instance()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_primary = true THEN
                -- Set all other instances for this user to non-primary
                UPDATE whatsapp_instances_comprehensive 
                SET is_primary = false 
                WHERE user_id = NEW.user_id 
                AND instance_id != NEW.instance_id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger
        DROP TRIGGER IF EXISTS trigger_ensure_single_primary_whatsapp_instance 
        ON whatsapp_instances_comprehensive;

        CREATE TRIGGER trigger_ensure_single_primary_whatsapp_instance
            BEFORE UPDATE OR INSERT ON whatsapp_instances_comprehensive
            FOR EACH ROW
            EXECUTE FUNCTION ensure_single_primary_whatsapp_instance();
      `;
      
      console.log('⚠️ Column does not exist. We need to add it manually.');
      console.log('📝 Please run this SQL in your Supabase Dashboard:');
      console.log(`
-- Add is_primary column to whatsapp_instances_comprehensive
ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_is_primary ON whatsapp_instances_comprehensive(is_primary);

-- Create function to ensure only one primary instance per user
CREATE OR REPLACE FUNCTION ensure_single_primary_whatsapp_instance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Set all other instances for this user to non-primary
        UPDATE whatsapp_instances_comprehensive 
        SET is_primary = false 
        WHERE user_id = NEW.user_id 
        AND instance_id != NEW.instance_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_whatsapp_instance ON whatsapp_instances_comprehensive;
CREATE TRIGGER trigger_ensure_single_primary_whatsapp_instance
    BEFORE UPDATE OR INSERT ON whatsapp_instances_comprehensive
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_whatsapp_instance();

-- Set first active instance for each user as primary
WITH first_active_instances AS (
    SELECT DISTINCT ON (user_id) 
        user_id, 
        instance_id
    FROM whatsapp_instances_comprehensive 
    WHERE is_active = true
    ORDER BY user_id, created_at ASC
)
UPDATE whatsapp_instances_comprehensive 
SET is_primary = true
FROM first_active_instances 
WHERE whatsapp_instances_comprehensive.user_id = first_active_instances.user_id
  AND whatsapp_instances_comprehensive.instance_id = first_active_instances.instance_id
  AND NOT EXISTS (
      SELECT 1 FROM whatsapp_instances_comprehensive wic2 
      WHERE wic2.user_id = whatsapp_instances_comprehensive.user_id 
      AND wic2.is_primary = true
  );
      `);
      
      console.log('\n🔗 Go to: https://app.supabase.com/project/jxhzveborezjhsmzsgbc/sql/new');
      console.log('📋 Copy and paste the SQL above, then run it.');
      console.log('✅ After running the SQL, the 400 errors should be fixed!');
      return;
      

    }
    
    // Set first active instance for each user as primary (if none exists)
    console.log('🔄 Setting default primary instances...');
    
    const setPrimarySQL = `
      WITH first_active_instances AS (
          SELECT DISTINCT ON (user_id) 
              user_id, 
              instance_id
          FROM whatsapp_instances_comprehensive 
          WHERE is_active = true
          ORDER BY user_id, created_at ASC
      )
      UPDATE whatsapp_instances_comprehensive 
      SET is_primary = true
      FROM first_active_instances 
      WHERE whatsapp_instances_comprehensive.user_id = first_active_instances.user_id
        AND whatsapp_instances_comprehensive.instance_id = first_active_instances.instance_id
        AND NOT EXISTS (
            SELECT 1 FROM whatsapp_instances_comprehensive wic2 
            WHERE wic2.user_id = whatsapp_instances_comprehensive.user_id 
            AND wic2.is_primary = true
        );
    `;
    
    console.log('🔄 Since column exists, skipping manual steps...');
    
    if (setPrimaryError) {
      console.error('❌ Error setting default primary instances:', setPrimaryError);
      return;
    }
    
    console.log('✅ Default primary instances set successfully');
    
    // Verify the migration
    const { data: instancesData, error: verifyError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('instance_id, user_id, is_primary, is_active')
      .order('user_id');
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
      return;
    }
    
    console.log('📊 Current instances with is_primary status:');
    instancesData.forEach(instance => {
      console.log(`  ${instance.instance_id}: primary=${instance.is_primary}, active=${instance.is_active}`);
    });
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyIsPrimaryMigration();
