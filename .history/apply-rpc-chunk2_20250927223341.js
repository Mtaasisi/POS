import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSecondFunction() {
  console.log('🔧 Creating get_po_inventory_stats function...');
  
  // Test if function already exists
  const { data: existingFunctions, error: checkError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_name', 'get_po_inventory_stats')
    .eq('routine_schema', 'public');

  if (existingFunctions && existingFunctions.length > 0) {
    console.log('✅ Function get_po_inventory_stats already exists');
    return true;
  }

  console.log('📝 Function does not exist, creating it...');
  console.log('⚠️  Please run the SQL script manually in your Supabase SQL Editor:');
  console.log('');
  console.log('-- Second function: get_po_inventory_stats');
  console.log('CREATE OR REPLACE FUNCTION get_po_inventory_stats(po_id UUID)');
  console.log('RETURNS TABLE (');
  console.log('    status TEXT,');
  console.log('    count BIGINT,');
  console.log('    total_value DECIMAL(15,2)');
  console.log(')');
  console.log('LANGUAGE plpgsql');
  console.log('SECURITY DEFINER');
  console.log('SET search_path = public');
  console.log('AS $$');
  console.log('BEGIN');
  console.log('    IF po_id IS NULL THEN');
  console.log('        RAISE EXCEPTION \'Purchase order ID cannot be null\';');
  console.log('    END IF;');
  console.log('    ');
  console.log('    RETURN QUERY');
  console.log('    SELECT');
  console.log('        COALESCE(ii.status, \'unknown\') as status,');
  console.log('        COUNT(*) as count,');
  console.log('        COALESCE(SUM(ii.cost_price), 0) as total_value');
  console.log('    FROM inventory_items ii');
  console.log('    WHERE ii.metadata->>\'purchase_order_id\' = po_id::TEXT');
  console.log('    GROUP BY ii.status');
  console.log('    ORDER BY ii.status;');
  console.log('    ');
  console.log('EXCEPTION');
  console.log('    WHEN OTHERS THEN');
  console.log('        RAISE EXCEPTION \'Error in get_po_inventory_stats for PO %: %\', po_id, SQLERRM;');
  console.log('END;');
  console.log('$$;');
  console.log('');
  console.log('GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;');
  
  return false;
}

// Run the script
createSecondFunction();
