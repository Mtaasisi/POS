// Test stock adjustment database connection
// This script tests the specific database tables and functionality used by stock adjustment

async function testStockAdjustmentDatabaseConnection() {
  console.log('🔍 Testing Stock Adjustment Database Connection...');
  console.log('================================================');
  
  const results = {
    connection: false,
    tables: {},
    functions: {},
    errors: []
  };
  
  try {
    // Test 1: Check if Supabase client is available
    console.log('1️⃣ Checking Supabase client availability...');
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase client not available');
    }
    console.log('✅ Supabase client available');
    results.connection = true;
    
    // Test 2: Test lats_product_variants table
    console.log('\n2️⃣ Testing lats_product_variants table...');
    try {
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select('id, product_id, sku, name, quantity, selling_price, cost_price, min_quantity, max_quantity')
        .limit(3);
        
      if (error) {
        console.error('❌ lats_product_variants table error:', error);
        results.tables.variants = { accessible: false, error: error.message };
      } else {
        console.log('✅ lats_product_variants table accessible');
        console.log(`📊 Found ${variants?.length || 0} variants`);
        if (variants && variants.length > 0) {
          console.log('📋 Sample variant:', {
            id: variants[0].id,
            sku: variants[0].sku,
            name: variants[0].name,
            quantity: variants[0].quantity
          });
        }
        results.tables.variants = { accessible: true, count: variants?.length || 0 };
      }
    } catch (error) {
      console.error('❌ lats_product_variants test failed:', error);
      results.tables.variants = { accessible: false, error: error.message };
    }
    
    // Test 3: Test lats_stock_movements table
    console.log('\n3️⃣ Testing lats_stock_movements table...');
    try {
      const { data: movements, error } = await supabase
        .from('lats_stock_movements')
        .select('id, product_id, variant_id, type, quantity, previous_quantity, new_quantity, reason, created_at')
        .limit(3);
        
      if (error) {
        console.error('❌ lats_stock_movements table error:', error);
        results.tables.movements = { accessible: false, error: error.message };
      } else {
        console.log('✅ lats_stock_movements table accessible');
        console.log(`📊 Found ${movements?.length || 0} stock movements`);
        if (movements && movements.length > 0) {
          console.log('📋 Sample movement:', {
            id: movements[0].id,
            type: movements[0].type,
            quantity: movements[0].quantity,
            reason: movements[0].reason
          });
        }
        results.tables.movements = { accessible: true, count: movements?.length || 0 };
      }
    } catch (error) {
      console.error('❌ lats_stock_movements test failed:', error);
      results.tables.movements = { accessible: false, error: error.message };
    }
    
    // Test 4: Test stock adjustment functionality
    console.log('\n4️⃣ Testing stock adjustment functionality...');
    if (results.tables.variants.accessible && results.tables.variants.count > 0) {
      try {
        // Get a test variant
        const { data: testVariant, error: fetchError } = await supabase
          .from('lats_product_variants')
          .select('*')
          .limit(1)
          .single();
          
        if (fetchError) {
          console.error('❌ Failed to fetch test variant:', fetchError);
          results.functions.stockAdjustment = { working: false, error: fetchError.message };
        } else {
          console.log('🧪 Testing with variant:', testVariant.sku);
          
          // Test stock update
          const originalQuantity = testVariant.quantity;
          const testQuantity = originalQuantity + 1;
          
          const { data: updateResult, error: updateError } = await supabase
            .from('lats_product_variants')
            .update({ quantity: testQuantity })
            .eq('id', testVariant.id)
            .select();
            
          if (updateError) {
            console.error('❌ Stock update failed:', updateError);
            results.functions.stockAdjustment = { working: false, error: updateError.message };
          } else {
            console.log('✅ Stock update successful');
            
            // Test stock movement creation
            const { data: movementResult, error: movementError } = await supabase
              .from('lats_stock_movements')
              .insert([{
                product_id: testVariant.product_id,
                variant_id: testVariant.id,
                type: 'adjustment',
                quantity: 1,
                previous_quantity: originalQuantity,
                new_quantity: testQuantity,
                reason: 'Database connection test',
                reference: 'TEST-' + Date.now(),
                notes: 'Stock adjustment database connection test',
                created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
              }])
              .select();
              
            if (movementError) {
              console.error('❌ Stock movement creation failed:', movementError);
              results.functions.stockAdjustment = { working: false, error: movementError.message };
            } else {
              console.log('✅ Stock movement created successfully');
              results.functions.stockAdjustment = { working: true };
              
              // Clean up test data
              console.log('🧹 Cleaning up test data...');
              
              // Restore original quantity
              await supabase
                .from('lats_product_variants')
                .update({ quantity: originalQuantity })
                .eq('id', testVariant.id);
                
              // Delete test movement
              if (movementResult && movementResult.length > 0) {
                await supabase
                  .from('lats_stock_movements')
                  .delete()
                  .eq('id', movementResult[0].id);
              }
              
              console.log('✅ Test data cleaned up');
            }
          }
        }
      } catch (error) {
        console.error('❌ Stock adjustment test failed:', error);
        results.functions.stockAdjustment = { working: false, error: error.message };
      }
    } else {
      console.log('⏭️ Skipping stock adjustment test - no variants available');
      results.functions.stockAdjustment = { working: false, error: 'No variants available for testing' };
    }
    
    // Test 5: Test authentication
    console.log('\n5️⃣ Testing authentication...');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Authentication error:', error);
        results.auth = { authenticated: false, error: error.message };
      } else if (user) {
        console.log('✅ User authenticated:', user.email);
        results.auth = { authenticated: true, user: user.email };
      } else {
        console.log('ℹ️ No user authenticated (this is normal for some operations)');
        results.auth = { authenticated: false, user: null };
      }
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      results.auth = { authenticated: false, error: error.message };
    }
    
    // Summary
    console.log('\n📊 STOCK ADJUSTMENT DATABASE CONNECTION TEST SUMMARY');
    console.log('==================================================');
    console.log(`🔗 Database Connection: ${results.connection ? '✅ Connected' : '❌ Failed'}`);
    console.log(`📦 Product Variants Table: ${results.tables.variants?.accessible ? '✅ Accessible' : '❌ Failed'}`);
    console.log(`📈 Stock Movements Table: ${results.tables.movements?.accessible ? '✅ Accessible' : '❌ Failed'}`);
    console.log(`⚙️ Stock Adjustment Function: ${results.functions.stockAdjustment?.working ? '✅ Working' : '❌ Failed'}`);
    console.log(`🔐 Authentication: ${results.auth?.authenticated ? '✅ Authenticated' : 'ℹ️ Not Authenticated'}`);
    
    if (results.tables.variants?.count !== undefined) {
      console.log(`📊 Variants Available: ${results.tables.variants.count}`);
    }
    if (results.tables.movements?.count !== undefined) {
      console.log(`📊 Stock Movements: ${results.tables.movements.count}`);
    }
    
    // Overall status
    const isWorking = results.connection && 
                     results.tables.variants?.accessible && 
                     results.tables.movements?.accessible && 
                     results.functions.stockAdjustment?.working;
    
    console.log(`\n🎯 OVERALL STATUS: ${isWorking ? '✅ STOCK ADJUSTMENT IS CONNECTED TO DATABASE' : '❌ STOCK ADJUSTMENT HAS DATABASE ISSUES'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Stock adjustment database connection test failed:', error);
    results.errors.push(error.message);
    return results;
  }
}

// Helper function to test a specific stock adjustment
async function testSpecificStockAdjustment(variantId, adjustmentQuantity = 1) {
  console.log(`🔍 Testing specific stock adjustment for variant: ${variantId}`);
  
  try {
    // Get current variant data
    const { data: variant, error: fetchError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('id', variantId)
      .single();
      
    if (fetchError) {
      console.error('❌ Variant fetch failed:', fetchError);
      return false;
    }
    
    console.log('📦 Current variant data:', {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      quantity: variant.quantity,
      selling_price: variant.selling_price
    });
    
    // Perform stock adjustment
    const previousQuantity = variant.quantity;
    const newQuantity = Math.max(0, previousQuantity + adjustmentQuantity);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('lats_product_variants')
      .update({ quantity: newQuantity })
      .eq('id', variantId)
      .select();
      
    if (updateError) {
      console.error('❌ Stock adjustment failed:', updateError);
      return false;
    }
    
    console.log('✅ Stock adjustment successful');
    
    // Create stock movement record
    const { data: movementResult, error: movementError } = await supabase
      .from('lats_stock_movements')
      .insert([{
        product_id: variant.product_id,
        variant_id: variantId,
        type: adjustmentQuantity > 0 ? 'in' : 'out',
        quantity: Math.abs(adjustmentQuantity),
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: 'Test adjustment',
        reference: 'TEST-' + Date.now(),
        notes: `Test adjustment of ${adjustmentQuantity} units`,
        created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
      }])
      .select();
      
    if (movementError) {
      console.error('❌ Stock movement creation failed:', movementError);
      return false;
    }
    
    console.log('✅ Stock movement created successfully');
    console.log('📊 Final result:', {
      previousQuantity,
      adjustmentQuantity,
      newQuantity,
      movementId: movementResult[0]?.id
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Stock adjustment test failed:', error);
    return false;
  }
}

console.log('🚀 Stock Adjustment Database Connection Test Functions Loaded!');
console.log('Available functions:');
console.log('- testStockAdjustmentDatabaseConnection() - Test complete stock adjustment database connectivity');
console.log('- testSpecificStockAdjustment(variantId, quantity) - Test specific stock adjustment');
console.log('');
console.log('Run testStockAdjustmentDatabaseConnection() to start testing...');
