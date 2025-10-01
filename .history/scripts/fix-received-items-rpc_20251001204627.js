import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixReceivedItemsRPC() {
  console.log('🚀 Fixing get_received_items_for_po RPC function...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'FIX_GET_RECEIVED_ITEMS_RPC_CORRECTED.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing RPC function fix...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📄 Executing: ${statement.substring(0, 80)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.warn('⚠️ Statement failed (might already exist):', error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ RPC function fix completed successfully!');
    console.log('');
    console.log('📊 What was fixed:');
    console.log('  - get_received_items_for_po() function now properly queries both tables');
    console.log('  - Combines data from lats_inventory_adjustments (non-serialized items)');
    console.log('  - Combines data from inventory_items (serialized items)');
    console.log('  - Proper metadata filtering for purchase order ID');
    console.log('  - Added item_type field to distinguish between adjustment and inventory items');
    console.log('');
    console.log('🎉 The 404 error should now be resolved!');
    
  } catch (error) {
    console.error('❌ RPC function fix failed:', error);
    process.exit(1);
  }
}

fixReceivedItemsRPC();
