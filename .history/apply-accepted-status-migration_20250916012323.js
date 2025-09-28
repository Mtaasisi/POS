import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function applyMigration() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔄 Applying accepted status migration...');

    // Drop the existing status constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE repair_parts DROP CONSTRAINT IF EXISTS repair_parts_status_check;'
    });

    if (dropError) {
      console.log('⚠️  Drop constraint error (may not exist):', dropError.message);
    } else {
      console.log('✅ Dropped existing constraint');
    }

    // Add the updated constraint with 'accepted' status
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE repair_parts ADD CONSTRAINT repair_parts_status_check 
            CHECK (status IN ('needed', 'ordered', 'accepted', 'received', 'used'));`
    });

    if (addError) {
      console.error('❌ Failed to add constraint:', addError.message);
      return;
    }

    console.log('✅ Added updated constraint with accepted status');

    // Add comment
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `COMMENT ON COLUMN repair_parts.status IS 'Repair part status: needed, ordered, accepted, received, used';`
    });

    if (commentError) {
      console.log('⚠️  Comment error (non-critical):', commentError.message);
    } else {
      console.log('✅ Added column comment');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('✅ repair_parts table now supports: needed, ordered, accepted, received, used');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

applyMigration();
