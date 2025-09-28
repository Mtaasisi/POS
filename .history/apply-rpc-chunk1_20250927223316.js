import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFirstFunction() {
  console.log('🔧 Creating get_purchase_order_items_with_products function...');
  
  // Test if function already exists
  const { data: existingFunctions, error: checkError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_name', 'get_purchase_order_items_with_products')
    .eq('routine_schema', 'public');

  if (existingFunctions && existingFunctions.length > 0) {
    console.log('✅ Function get_purchase_order_items_with_products already exists');
    return true;
  }

  console.log('📝 Function does not exist, creating it...');
  console.log('⚠️  Please run the SQL script manually in your Supabase SQL Editor:');
  console.log('');
  console.log('-- First function: get_purchase_order_items_with_products');
  console.log('CREATE OR REPLACE FUNCTION get_purchase_order_items_with_products(purchase_order_id_param UUID)');
  console.log('RETURNS TABLE (');
  console.log('    id UUID,');
  console.log('    purchase_order_id UUID,');
  console.log('    product_id UUID,');
  console.log('    variant_id UUID,');
  console.log('    quantity INTEGER,');
  console.log('    unit_cost DECIMAL(15,2),');
  console.log('    total_cost DECIMAL(15,2),');
  console.log('    received_quantity INTEGER,');
  console.log('    remaining_quantity INTEGER,');
  console.log('    status TEXT,');
  console.log('    notes TEXT,');
  console.log('    created_at TIMESTAMPTZ,');
  console.log('    updated_at TIMESTAMPTZ,');
  console.log('    product_name TEXT,');
  console.log('    product_sku TEXT,');
  console.log('    product_description TEXT,');
  console.log('    product_category TEXT,');
  console.log('    product_brand TEXT,');
  console.log('    variant_name TEXT,');
  console.log('    variant_sku TEXT,');
  console.log('    variant_attributes JSONB,');
  console.log('    completion_percentage DECIMAL(5,2),');
  console.log('    is_fully_received BOOLEAN');
  console.log(')');
  console.log('LANGUAGE plpgsql');
  console.log('SECURITY DEFINER');
  console.log('SET search_path = public');
  console.log('AS $$');
  console.log('BEGIN');
  console.log('    IF purchase_order_id_param IS NULL THEN');
  console.log('        RAISE EXCEPTION \'Purchase order ID parameter cannot be null\';');
  console.log('    END IF;');
  console.log('    ');
  console.log('    RETURN QUERY');
  console.log('    SELECT');
  console.log('        poi.id,');
  console.log('        poi.purchase_order_id,');
  console.log('        poi.product_id,');
  console.log('        poi.variant_id,');
  console.log('        poi.quantity,');
  console.log('        poi.unit_cost,');
  console.log('        poi.total_cost,');
  console.log('        COALESCE(poi.received_quantity, 0) as received_quantity,');
  console.log('        (poi.quantity - COALESCE(poi.received_quantity, 0)) as remaining_quantity,');
  console.log('        COALESCE(poi.status, \'pending\') as status,');
  console.log('        poi.notes,');
  console.log('        poi.created_at,');
  console.log('        poi.updated_at,');
  console.log('        COALESCE(p.name, \'Unknown Product\') as product_name,');
  console.log('        COALESCE(p.sku, \'\') as product_sku,');
  console.log('        COALESCE(p.description, \'\') as product_description,');
  console.log('        COALESCE(p.category, \'\') as product_category,');
  console.log('        COALESCE(p.brand, \'\') as product_brand,');
  console.log('        COALESCE(pv.name, \'\') as variant_name,');
  console.log('        COALESCE(pv.sku, \'\') as variant_sku,');
  console.log('        COALESCE(pv.attributes, \'{}\'::JSONB) as variant_attributes,');
  console.log('        CASE');
  console.log('            WHEN poi.quantity > 0 THEN');
  console.log('                ROUND((COALESCE(poi.received_quantity, 0)::DECIMAL / poi.quantity::DECIMAL) * 100, 2)');
  console.log('            ELSE 0');
  console.log('        END as completion_percentage,');
  console.log('        (COALESCE(poi.received_quantity, 0) >= poi.quantity) as is_fully_received');
  console.log('    FROM lats_purchase_order_items poi');
  console.log('    LEFT JOIN lats_products p ON poi.product_id = p.id');
  console.log('    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id');
  console.log('    WHERE poi.purchase_order_id = purchase_order_id_param');
  console.log('    ORDER BY poi.created_at DESC;');
  console.log('    ');
  console.log('EXCEPTION');
  console.log('    WHEN OTHERS THEN');
  console.log('        RAISE EXCEPTION \'Error in get_purchase_order_items_with_products for PO %: %\', purchase_order_id_param, SQLERRM;');
  console.log('END;');
  console.log('$$;');
  console.log('');
  console.log('GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;');
  
  return false;
}

// Run the script
createFirstFunction();
