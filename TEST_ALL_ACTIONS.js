/**
 * COMPREHENSIVE TEST SCRIPT FOR PURCHASE ORDER ACTIONS
 * Run this script to test all action button functionality
 */

import { supabase } from './src/lib/supabaseClient.js';
import PurchaseOrderActionsService from './src/features/lats/services/purchaseOrderActionsService.js';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual IDs from your database
  TEST_ORDER_ID: null, // Will be set during test
  TEST_ITEM_ID: null,  // Will be set during test
  TEST_USER_ID: null,  // Will be set during test
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Utility function to log test results
 */
function logTest(testName, success, error = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    if (error) {
      testResults.errors.push({ test: testName, error: error.message });
      console.error(`   Error: ${error.message}`);
    }
  }
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  try {
    // Get a draft purchase order for testing
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id, status, items:lats_purchase_order_items(id)')
      .eq('status', 'draft')
      .limit(1);
    
    if (ordersError) throw ordersError;
    
    if (!orders || orders.length === 0) {
      console.log('⚠️  No draft orders found. Creating test order...');
      // You might want to create a test order here
      throw new Error('No test data available');
    }
    
    TEST_CONFIG.TEST_ORDER_ID = orders[0].id;
    TEST_CONFIG.TEST_ITEM_ID = orders[0].items?.[0]?.id;
    
    console.log(`✅ Test data setup complete:`);
    console.log(`   Order ID: ${TEST_CONFIG.TEST_ORDER_ID}`);
    console.log(`   Item ID: ${TEST_CONFIG.TEST_ITEM_ID}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to setup test data:', error.message);
    return false;
  }
}

/**
 * Test 1: Delete Order Action
 */
async function testDeleteOrder() {
  console.log('\n🧪 Testing Delete Order Action...');
  
  try {
    // Create a test order first (since we'll delete it)
    const testOrder = {
      order_number: 'TEST-DELETE-' + Date.now(),
      status: 'draft',
      supplier_id: 'test-supplier',
      total_amount: 100,
      currency: 'TZS',
      created_by: TEST_CONFIG.TEST_USER_ID,
      created_at: new Date().toISOString()
    };
    
    const { data: createdOrder, error: createError } = await supabase
      .from('lats_purchase_orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Test delete action
    const result = await PurchaseOrderActionsService.deleteOrder(createdOrder.id);
    
    if (result.success) {
      logTest('Delete Order', true);
    } else {
      logTest('Delete Order', false, new Error(result.message));
    }
  } catch (error) {
    logTest('Delete Order', false, error);
  }
}

/**
 * Test 2: Cancel Order Action
 */
async function testCancelOrder() {
  console.log('\n🧪 Testing Cancel Order Action...');
  
  try {
    // Create a sent order for testing
    const testOrder = {
      order_number: 'TEST-CANCEL-' + Date.now(),
      status: 'sent',
      supplier_id: 'test-supplier',
      total_amount: 100,
      currency: 'TZS',
      created_by: TEST_CONFIG.TEST_USER_ID,
      created_at: new Date().toISOString()
    };
    
    const { data: createdOrder, error: createError } = await supabase
      .from('lats_purchase_orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Test cancel action
    const result = await PurchaseOrderActionsService.cancelOrder(createdOrder.id);
    
    if (result.success) {
      logTest('Cancel Order', true);
    } else {
      logTest('Cancel Order', false, new Error(result.message));
    }
  } catch (error) {
    logTest('Cancel Order', false, error);
  }
}

/**
 * Test 3: Quality Check Actions
 */
async function testQualityCheck() {
  console.log('\n🧪 Testing Quality Check Actions...');
  
  try {
    if (!TEST_CONFIG.TEST_ITEM_ID) {
      throw new Error('No test item available');
    }
    
    // Test individual quality check
    const result1 = await PurchaseOrderActionsService.updateItemQualityCheck(
      TEST_CONFIG.TEST_ITEM_ID, 
      'passed', 
      'Test quality check passed'
    );
    
    if (result1.success) {
      logTest('Update Item Quality Check', true);
    } else {
      logTest('Update Item Quality Check', false, new Error(result1.message));
    }
    
    // Test complete quality check
    const result2 = await PurchaseOrderActionsService.completeQualityCheck(TEST_CONFIG.TEST_ORDER_ID);
    
    if (result2.success) {
      logTest('Complete Quality Check', true);
    } else {
      logTest('Complete Quality Check', false, new Error(result2.message));
    }
  } catch (error) {
    logTest('Quality Check Actions', false, error);
  }
}

/**
 * Test 4: SMS Integration
 */
async function testSMSIntegration() {
  console.log('\n🧪 Testing SMS Integration...');
  
  try {
    const result = await PurchaseOrderActionsService.sendSMS(
      '+255123456789', 
      'Test SMS message', 
      TEST_CONFIG.TEST_ORDER_ID
    );
    
    if (result.success) {
      logTest('SMS Integration', true);
    } else {
      logTest('SMS Integration', false, new Error(result.message));
    }
  } catch (error) {
    logTest('SMS Integration', false, error);
  }
}

/**
 * Test 5: Notes System
 */
async function testNotesSystem() {
  console.log('\n🧪 Testing Notes System...');
  
  try {
    // Test add note
    const result1 = await PurchaseOrderActionsService.addNote(
      TEST_CONFIG.TEST_ORDER_ID,
      'Test note content',
      'Test User'
    );
    
    if (result1.success) {
      logTest('Add Note', true);
    } else {
      logTest('Add Note', false, new Error(result1.message));
    }
    
    // Test get notes
    const result2 = await PurchaseOrderActionsService.getNotes(TEST_CONFIG.TEST_ORDER_ID);
    
    if (result2.success) {
      logTest('Get Notes', true);
    } else {
      logTest('Get Notes', false, new Error(result2.message));
    }
  } catch (error) {
    logTest('Notes System', false, error);
  }
}

/**
 * Test 6: Bulk Actions
 */
async function testBulkActions() {
  console.log('\n🧪 Testing Bulk Actions...');
  
  try {
    if (!TEST_CONFIG.TEST_ITEM_ID) {
      throw new Error('No test items available');
    }
    
    // Test bulk update status
    const result1 = await PurchaseOrderActionsService.bulkUpdateStatus(
      [TEST_CONFIG.TEST_ITEM_ID], 
      'processing'
    );
    
    if (result1.success) {
      logTest('Bulk Update Status', true);
    } else {
      logTest('Bulk Update Status', false, new Error(result1.message));
    }
    
    // Test bulk assign location
    const result2 = await PurchaseOrderActionsService.bulkAssignLocation(
      [TEST_CONFIG.TEST_ITEM_ID], 
      'Warehouse A'
    );
    
    if (result2.success) {
      logTest('Bulk Assign Location', true);
    } else {
      logTest('Bulk Assign Location', false, new Error(result2.message));
    }
  } catch (error) {
    logTest('Bulk Actions', false, error);
  }
}

/**
 * Test 7: Return Order
 */
async function testReturnOrder() {
  console.log('\n🧪 Testing Return Order...');
  
  try {
    const returnData = {
      reason: 'Test return reason',
      returnType: 'defective',
      items: [{ itemId: TEST_CONFIG.TEST_ITEM_ID, quantity: 1 }],
      notes: 'Test return order'
    };
    
    const result = await PurchaseOrderActionsService.createReturnOrder(
      TEST_CONFIG.TEST_ORDER_ID, 
      returnData
    );
    
    if (result.success) {
      logTest('Create Return Order', true);
    } else {
      logTest('Create Return Order', false, new Error(result.message));
    }
  } catch (error) {
    logTest('Return Order', false, error);
  }
}

/**
 * Test 8: Duplicate Order
 */
async function testDuplicateOrder() {
  console.log('\n🧪 Testing Duplicate Order...');
  
  try {
    const result = await PurchaseOrderActionsService.duplicateOrder(TEST_CONFIG.TEST_ORDER_ID);
    
    if (result.success) {
      logTest('Duplicate Order', true);
    } else {
      logTest('Duplicate Order', false, new Error(result.message));
    }
  } catch (error) {
    logTest('Duplicate Order', false, error);
  }
}

/**
 * Test 9: Database Tables Verification
 */
async function testDatabaseTables() {
  console.log('\n🧪 Testing Database Tables...');
  
  try {
    const tables = [
      'purchase_order_quality_checks',
      'purchase_order_returns',
      'purchase_order_return_items',
      'purchase_order_messages',
      'purchase_order_audit'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logTest(`Database Table: ${table}`, false, error);
      } else {
        logTest(`Database Table: ${table}`, true);
      }
    }
  } catch (error) {
    logTest('Database Tables', false, error);
  }
}

/**
 * Test 10: Audit Logging
 */
async function testAuditLogging() {
  console.log('\n🧪 Testing Audit Logging...');
  
  try {
    await PurchaseOrderActionsService.logAction(
      TEST_CONFIG.TEST_ORDER_ID,
      'test_action',
      { test: 'data' }
    );
    
    // Verify audit record was created
    const { data, error } = await supabase
      .from('purchase_order_audit')
      .select('*')
      .eq('purchase_order_id', TEST_CONFIG.TEST_ORDER_ID)
      .eq('action', 'test_action')
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      logTest('Audit Logging', true);
    } else {
      logTest('Audit Logging', false, new Error('No audit record found'));
    }
  } catch (error) {
    logTest('Audit Logging', false, error);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Purchase Order Actions Test Suite');
  console.log('=' .repeat(60));
  
  // Setup test data
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Test setup failed. Cannot continue.');
    return;
  }
  
  // Run all tests
  await testDatabaseTables();
  await testDeleteOrder();
  await testCancelOrder();
  await testQualityCheck();
  await testSMSIntegration();
  await testNotesSystem();
  await testBulkActions();
  await testReturnOrder();
  await testDuplicateOrder();
  await testAuditLogging();
  
  // Print results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Test suite completed!');
}

// Export for use in other files
export { runAllTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
