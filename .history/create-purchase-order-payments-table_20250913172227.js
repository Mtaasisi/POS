import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  try {
    console.log('🚀 Creating purchase_order_payments table...');
    
    // First, let's try to query the table directly to see if it exists
    const { data: existingData, error: checkError } = await supabase
      .from('purchase_order_payments')
      .select('id')
      .limit(1);
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log('📋 Table does not exist, need to create it manually in Supabase dashboard');
        console.log('');
        console.log('🔧 Please run this SQL in your Supabase SQL Editor:');
        console.log('');
        console.log('-- Create purchase_order_payments table');
        console.log('CREATE TABLE IF NOT EXISTS purchase_order_payments (');
        console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
        console.log('    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,');
        console.log('    payment_account_id UUID NOT NULL REFERENCES finance_accounts(id),');
        console.log('    amount DECIMAL(15,2) NOT NULL,');
        console.log('    currency VARCHAR(3) DEFAULT \'TZS\',');
        console.log('    payment_method VARCHAR(100) NOT NULL,');
        console.log('    payment_method_id UUID NOT NULL,');
        console.log('    reference VARCHAR(255),');
        console.log('    notes TEXT,');
        console.log('    status VARCHAR(20) DEFAULT \'completed\' CHECK (status IN (\'pending\', \'completed\', \'failed\', \'cancelled\')),');
        console.log('    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('    created_by UUID NOT NULL REFERENCES auth.users(id),');
        console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('-- Add indexes');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_po_id ON purchase_order_payments(purchase_order_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_account_id ON purchase_order_payments(payment_account_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_status ON purchase_order_payments(status);');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_payment_date ON purchase_order_payments(payment_date);');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_created_at ON purchase_order_payments(created_at);');
        console.log('');
        console.log('-- Create trigger to update updated_at timestamp');
        console.log('CREATE TRIGGER update_purchase_order_payments_updated_at');
        console.log('    BEFORE UPDATE ON purchase_order_payments');
        console.log('    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
        console.log('');
        console.log('-- Enable RLS');
        console.log('ALTER TABLE purchase_order_payments ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('-- Create policies');
        console.log('CREATE POLICY "Users can view purchase order payments" ON purchase_order_payments');
        console.log('    FOR SELECT USING (');
        console.log('        EXISTS (');
        console.log('            SELECT 1 FROM lats_purchase_orders po');
        console.log('            WHERE po.id = purchase_order_payments.purchase_order_id');
        console.log('            AND po.created_by = auth.uid()');
        console.log('        )');
        console.log('    );');
        console.log('');
        console.log('CREATE POLICY "Users can create purchase order payments" ON purchase_order_payments');
        console.log('    FOR INSERT WITH CHECK (');
        console.log('        created_by = auth.uid()');
        console.log('        AND EXISTS (');
        console.log('            SELECT 1 FROM lats_purchase_orders po');
        console.log('            WHERE po.id = purchase_order_payments.purchase_order_id');
        console.log('            AND po.created_by = auth.uid()');
        console.log('        )');
        console.log('    );');
        console.log('');
        console.log('CREATE POLICY "Users can update their purchase order payments" ON purchase_order_payments');
        console.log('    FOR UPDATE USING (');
        console.log('        created_by = auth.uid()');
        console.log('    );');
        console.log('');
        console.log('CREATE POLICY "Users can delete their purchase order payments" ON purchase_order_payments');
        console.log('    FOR DELETE USING (');
        console.log('        created_by = auth.uid()');
        console.log('    );');
        console.log('');
        console.log('-- Add payment tracking columns to purchase orders table');
        console.log('ALTER TABLE lats_purchase_orders ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0;');
        console.log('ALTER TABLE lats_purchase_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT \'unpaid\' CHECK (payment_status IN (\'unpaid\', \'partial\', \'paid\'));');
        console.log('');
        console.log('✅ After running the SQL above, the table will be created and your payment errors should be resolved!');
        return;
      } else {
        console.error('❌ Error checking existing tables:', checkError);
        return;
      }
    }
    
    console.log('✅ Table purchase_order_payments already exists and is accessible!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createTable();
