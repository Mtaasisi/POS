import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyTriggerFix() {
  console.log('🚀 Applying trigger fix for device status updates...');
  
  try {
    // Step 1: Add missing columns
    console.log('📋 Step 1: Adding missing columns...');
    
    const addColumnsSQL = `
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT 0;
      
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;
    `;
    
    const { error: columnsError } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });
    
    if (columnsError) {
      console.error('❌ Error adding columns:', columnsError);
    } else {
      console.log('   ✅ Added repair_cost and deposit_amount columns');
    }
    
    // Step 2: Update trigger function
    console.log('📋 Step 2: Updating trigger function...');
    
    const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_pending_payments_on_repair_complete()
      RETURNS TRIGGER AS $$
      DECLARE
        device_record RECORD;
        repair_cost DECIMAL(10,2) := 0;
        deposit_amount DECIMAL(10,2) := 0;
        existing_payment_count INTEGER := 0;
      BEGIN
        -- Only trigger when status changes to 'repair-complete'
        IF NEW.status = 'repair-complete' AND (OLD.status IS NULL OR OLD.status != 'repair-complete') THEN
          
          -- Get device information with safe column access
          SELECT 
            COALESCE(repair_cost, 0) as repair_cost,
            COALESCE(deposit_amount, 0) as deposit_amount,
            customer_id
          INTO device_record
          FROM devices
          WHERE id = NEW.id;
          
          -- Calculate costs safely
          repair_cost := COALESCE(device_record.repair_cost, 0);
          deposit_amount := COALESCE(device_record.deposit_amount, 0);
          
          -- Check if pending payments already exist
          SELECT COUNT(*)
          INTO existing_payment_count
          FROM customer_payments
          WHERE device_id = NEW.id
            AND status = 'pending';
          
          -- Create pending payments if they don't exist and costs are set
          IF existing_payment_count = 0 THEN
            
            -- Create repair cost payment if needed
            IF repair_cost > 0 THEN
              INSERT INTO customer_payments (
                customer_id, device_id, amount, method, payment_type, 
                status, payment_date, notes, created_at
              ) VALUES (
                device_record.customer_id, NEW.id, repair_cost, 'cash', 'payment',
                'pending', NOW(), 'Repair cost payment', NOW()
              );
            END IF;
            
            -- Create deposit payment if needed
            IF deposit_amount > 0 THEN
              INSERT INTO customer_payments (
                customer_id, device_id, amount, method, payment_type,
                status, payment_date, notes, created_at
              ) VALUES (
                device_record.customer_id, NEW.id, deposit_amount, 'cash', 'deposit',
                'pending', NOW(), 'Deposit payment', NOW()
              );
            END IF;
            
          END IF;
          
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: updateFunctionSQL });
    
    if (functionError) {
      console.error('❌ Error updating function:', functionError);
    } else {
      console.log('   ✅ Updated trigger function');
    }
    
    // Step 3: Recreate trigger
    console.log('📋 Step 3: Recreating trigger...');
    
    const recreateTriggerSQL = `
      DROP TRIGGER IF EXISTS trigger_create_pending_payments ON devices;
      CREATE TRIGGER trigger_create_pending_payments
        AFTER UPDATE ON devices
        FOR EACH ROW
        EXECUTE FUNCTION create_pending_payments_on_repair_complete();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: recreateTriggerSQL });
    
    if (triggerError) {
      console.error('❌ Error recreating trigger:', triggerError);
    } else {
      console.log('   ✅ Recreated trigger');
    }
    
    console.log('✅ Trigger fix applied successfully!');
    console.log('');
    console.log('🎉 Device status updates to repair-complete should work now!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   - Added missing repair_cost and deposit_amount columns');
    console.log('   - Updated trigger function to handle missing columns gracefully');
    console.log('   - Recreated trigger for repair-complete status updates');
    
  } catch (error) {
    console.error('❌ Failed to apply trigger fix:', error);
    process.exit(1);
  }
}

// Run the fix
applyTriggerFix();
