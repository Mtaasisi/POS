import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRPCFunctions() {
  console.log('🔧 Starting to apply missing RPC functions...');
  
  try {
    // Step 1: Drop existing functions
    console.log('📝 Step 1: Dropping existing functions...');
    const dropQueries = [
      'DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);',
      'DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(TEXT);',
      'DROP FUNCTION IF EXISTS get_po_inventory_stats(UUID);',
      'DROP FUNCTION IF EXISTS get_po_inventory_stats(TEXT);',
      'DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);',
      'DROP FUNCTION IF EXISTS get_received_items_for_po(TEXT);'
    ];
    
    for (const query of dropQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`⚠️  Warning dropping function: ${error.message}`);
      }
    }
    
    console.log('✅ Step 1 completed');
    
    // Step 2: Create first function
    console.log('📝 Step 2: Creating get_purchase_order_items_with_products function...');
    await createFirstFunction();
    
  } catch (error) {
    console.error('❌ Error applying RPC functions:', error);
  }
}

async function createFirstFunction() {
  const functionSQL = `
CREATE OR REPLACE FUNCTION get_purchase_order_items_with_products(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    purchase_order_id UUID,
    product_id UUID,
    variant_id UUID,
    quantity INTEGER,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    received_quantity INTEGER,
    remaining_quantity INTEGER,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    product_name TEXT,
    product_sku TEXT,
    product_description TEXT,
    product_category TEXT,
    product_brand TEXT,
    variant_name TEXT,
    variant_sku TEXT,
    variant_attributes JSONB,
    completion_percentage DECIMAL(5,2),
    is_fully_received BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF purchase_order_id_param IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID parameter cannot be null';
    END IF;
    
    RETURN QUERY
    SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_id,
        poi.variant_id,
        poi.quantity,
        poi.unit_cost,
        poi.total_cost,
        COALESCE(poi.received_quantity, 0) as received_quantity,
        (poi.quantity - COALESCE(poi.received_quantity, 0)) as remaining_quantity,
        COALESCE(poi.status, 'pending') as status,
        poi.notes,
        poi.created_at,
        poi.updated_at,
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.sku, '') as product_sku,
        COALESCE(p.description, '') as product_description,
        COALESCE(p.category, '') as product_category,
        COALESCE(p.brand, '') as product_brand,
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.sku, '') as variant_sku,
        COALESCE(pv.attributes, '{}'::JSONB) as variant_attributes,
        CASE 
            WHEN poi.quantity > 0 THEN 
                ROUND((COALESCE(poi.received_quantity, 0)::DECIMAL / poi.quantity::DECIMAL) * 100, 2)
            ELSE 0 
        END as completion_percentage,
        (COALESCE(poi.received_quantity, 0) >= poi.quantity) as is_fully_received
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = purchase_order_id_param
    ORDER BY poi.created_at DESC;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_purchase_order_items_with_products for PO %: %', purchase_order_id_param, SQLERRM;
END;
$$;`;

  const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
  
  if (error) {
    console.error('❌ Error creating get_purchase_order_items_with_products:', error);
    return false;
  }
  
  console.log('✅ get_purchase_order_items_with_products function created successfully');
  return true;
}

// Run the script
applyRPCFunctions();
