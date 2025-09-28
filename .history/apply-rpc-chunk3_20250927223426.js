import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createThirdFunction() {
  console.log('🔧 Creating get_received_items_for_po function...');
  
  // Test if function already exists
  const { data: existingFunctions, error: checkError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_name', 'get_received_items_for_po')
    .eq('routine_schema', 'public');

  if (existingFunctions && existingFunctions.length > 0) {
    console.log('✅ Function get_received_items_for_po already exists');
    return true;
  }

  console.log('📝 Function does not exist, creating it...');
  console.log('⚠️  Please run the SQL script manually in your Supabase SQL Editor:');
  console.log('');
  console.log('-- Third function: get_received_items_for_po');
  console.log('CREATE OR REPLACE FUNCTION get_received_items_for_po(po_id UUID)');
  console.log('RETURNS TABLE (');
  console.log('    id UUID,');
  console.log('    product_id UUID,');
  console.log('    variant_id UUID,');
  console.log('    serial_number TEXT,');
  console.log('    imei TEXT,');
  console.log('    mac_address TEXT,');
  console.log('    barcode TEXT,');
  console.log('    status TEXT,');
  console.log('    location TEXT,');
  console.log('    shelf TEXT,');
  console.log('    bin TEXT,');
  console.log('    purchase_date TIMESTAMPTZ,');
  console.log('    warranty_start TIMESTAMPTZ,');
  console.log('    warranty_end TIMESTAMPTZ,');
  console.log('    cost_price DECIMAL(15,2),');
  console.log('    selling_price DECIMAL(15,2),');
  console.log('    notes TEXT,');
  console.log('    created_at TIMESTAMPTZ,');
  console.log('    product_name TEXT,');
  console.log('    product_sku TEXT,');
  console.log('    variant_name TEXT,');
  console.log('    variant_sku TEXT');
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
  console.log('        ii.id,');
  console.log('        ii.product_id,');
  console.log('        ii.variant_id,');
  console.log('        ii.serial_number,');
  console.log('        ii.imei,');
  console.log('        ii.mac_address,');
  console.log('        ii.barcode,');
  console.log('        COALESCE(ii.status, \'available\') as status,');
  console.log('        ii.location,');
  console.log('        ii.shelf,');
  console.log('        ii.bin,');
  console.log('        ii.purchase_date,');
  console.log('        ii.warranty_start,');
  console.log('        ii.warranty_end,');
  console.log('        ii.cost_price,');
  console.log('        ii.selling_price,');
  console.log('        ii.notes,');
  console.log('        ii.created_at,');
  console.log('        COALESCE(p.name, \'Unknown Product\') as product_name,');
  console.log('        COALESCE(p.sku, \'\') as product_sku,');
  console.log('        COALESCE(pv.name, \'\') as variant_name,');
  console.log('        COALESCE(pv.sku, \'\') as variant_sku');
  console.log('    FROM inventory_items ii');
  console.log('    LEFT JOIN lats_products p ON ii.product_id = p.id');
  console.log('    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id');
  console.log('    WHERE ii.metadata->>\'purchase_order_id\' = po_id::TEXT');
  console.log('    AND ii.id IS NOT NULL');
  console.log('    ');
  console.log('    UNION ALL');
  console.log('    ');
  console.log('    SELECT');
  console.log('        lia.id,');
  console.log('        lia.product_id,');
  console.log('        lia.variant_id,');
  console.log('        NULL::TEXT as serial_number,');
  console.log('        NULL::TEXT as imei,');
  console.log('        NULL::TEXT as mac_address,');
  console.log('        NULL::TEXT as barcode,');
  console.log('        \'received\'::TEXT as status,');
  console.log('        NULL::TEXT as location,');
  console.log('        NULL::TEXT as shelf,');
  console.log('        NULL::TEXT as bin,');
  console.log('        lia.created_at as purchase_date,');
  console.log('        NULL::TIMESTAMPTZ as warranty_start,');
  console.log('        NULL::TIMESTAMPTZ as warranty_end,');
  console.log('        lia.cost_price,');
  console.log('        NULL::DECIMAL(15,2) as selling_price,');
  console.log('        COALESCE(lia.reason, \'\') as notes,');
  console.log('        lia.created_at,');
  console.log('        COALESCE(p.name, \'Unknown Product\') as product_name,');
  console.log('        COALESCE(p.sku, \'\') as product_sku,');
  console.log('        COALESCE(pv.name, \'\') as variant_name,');
  console.log('        COALESCE(pv.sku, \'\') as variant_sku');
  console.log('    FROM lats_inventory_adjustments lia');
  console.log('    LEFT JOIN lats_products p ON lia.product_id = p.id');
  console.log('    LEFT JOIN lats_product_variants pv ON lia.variant_id = pv.id');
  console.log('    WHERE lia.purchase_order_id = po_id');
  console.log('    AND lia.adjustment_type = \'receive\'');
  console.log('    AND lia.id IS NOT NULL');
  console.log('    ');
  console.log('    ORDER BY created_at DESC;');
  console.log('    ');
  console.log('EXCEPTION');
  console.log('    WHEN OTHERS THEN');
  console.log('        RAISE EXCEPTION \'Error in get_received_items_for_po for PO %: %\', po_id, SQLERRM;');
  console.log('END;');
  console.log('$$;');
  console.log('');
  console.log('GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;');
  
  return false;
}

// Run the script
createThirdFunction();
