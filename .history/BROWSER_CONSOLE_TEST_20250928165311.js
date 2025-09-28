/**
 * BROWSER CONSOLE TEST FOR PURCHASE ORDER ACTIONS
 * Copy and paste this code into your browser console while on a purchase order page
 */

console.log('🚀 Starting Purchase Order Actions Test...');

// Test 1: Check if service is available
console.log('\n1️⃣ Testing Service Availability...');
if (typeof PurchaseOrderActionsService !== 'undefined') {
    console.log('✅ PurchaseOrderActionsService is available');
} else {
    console.log('❌ PurchaseOrderActionsService not found');
}

// Test 2: Check if we have a purchase order
console.log('\n2️⃣ Testing Purchase Order Context...');
const currentUrl = window.location.href;
const orderIdMatch = currentUrl.match(/\/purchase-orders\/([^\/\?]+)/);
if (orderIdMatch) {
    const orderId = orderIdMatch[1];
    console.log('✅ Purchase order ID found:', orderId);
    
    // Test 3: Test basic service methods
    console.log('\n3️⃣ Testing Service Methods...');
    
    // Test notes functionality
    console.log('Testing notes system...');
    PurchaseOrderActionsService.getNotes(orderId)
        .then(result => {
            if (result.success) {
                console.log('✅ Get Notes: Success');
                console.log('   Notes found:', result.data?.length || 0);
            } else {
                console.log('❌ Get Notes: Failed -', result.message);
            }
        })
        .catch(error => {
            console.log('❌ Get Notes: Error -', error.message);
        });
    
    // Test audit logging
    console.log('Testing audit logging...');
    PurchaseOrderActionsService.logAction(orderId, 'console_test', { test: true })
        .then(() => {
            console.log('✅ Audit Logging: Success');
        })
        .catch(error => {
            console.log('❌ Audit Logging: Error -', error.message);
        });
    
    // Test 4: Check action buttons in DOM
    console.log('\n4️⃣ Testing Action Buttons in DOM...');
    const actionButtons = [
        { text: 'Delete Order', selector: 'button:contains("Delete Order")' },
        { text: 'Cancel Order', selector: 'button:contains("Cancel Order")' },
        { text: 'Quality Check', selector: 'button:contains("Quality Check")' },
        { text: 'WhatsApp', selector: 'button:contains("WhatsApp")' },
        { text: 'SMS', selector: 'button:contains("SMS")' },
        { text: 'Notes', selector: 'button:contains("Notes")' },
        { text: 'Bulk Actions', selector: 'button:contains("Bulk Actions")' },
        { text: 'Return Order', selector: 'button:contains("Return Order")' },
        { text: 'Duplicate', selector: 'button:contains("Duplicate")' }
    ];
    
    actionButtons.forEach(button => {
        const element = document.querySelector(`button[title*="${button.text}"], button:contains("${button.text}")`);
        if (element) {
            console.log(`✅ ${button.text} button found`);
        } else {
            console.log(`❌ ${button.text} button not found`);
        }
    });
    
    // Test 5: Check modal elements
    console.log('\n5️⃣ Testing Modal Elements...');
    const modals = [
        'Quality Control Modal',
        'Notes Modal', 
        'Bulk Actions Modal',
        'Return Order Modal'
    ];
    
    modals.forEach(modal => {
        const modalElement = document.querySelector(`[class*="modal"], [class*="Modal"]`);
        if (modalElement) {
            console.log(`✅ ${modal} container found`);
        } else {
            console.log(`❌ ${modal} container not found`);
        }
    });
    
} else {
    console.log('❌ No purchase order ID found in URL');
    console.log('   Current URL:', currentUrl);
    console.log('   Please navigate to a purchase order detail page');
}

// Test 6: Check for errors in console
console.log('\n6️⃣ Checking for JavaScript Errors...');
const originalError = console.error;
const errors = [];
console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
};

// Test 7: Test database connection (if possible)
console.log('\n7️⃣ Testing Database Connection...');
if (typeof supabase !== 'undefined') {
    supabase
        .from('purchase_order_audit')
        .select('*')
        .limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.log('❌ Database connection failed:', error.message);
            } else {
                console.log('✅ Database connection successful');
            }
        })
        .catch(error => {
            console.log('❌ Database connection error:', error.message);
        });
} else {
    console.log('❌ Supabase client not available');
}

// Test 8: Summary
setTimeout(() => {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log('Errors found:', errors.length);
    if (errors.length > 0) {
        console.log('Error details:');
        errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
    }
    
    console.log('\n✅ Browser console test completed!');
    console.log('💡 For full testing, follow the MANUAL_TEST_GUIDE.md');
}, 2000);

// Helper function to test a specific action
window.testPurchaseOrderAction = function(actionName) {
    console.log(`🧪 Testing ${actionName} action...`);
    
    switch(actionName) {
        case 'notes':
            if (orderIdMatch) {
                PurchaseOrderActionsService.addNote(orderIdMatch[1], 'Console test note', 'Test User')
                    .then(result => console.log(`${actionName} result:`, result))
                    .catch(error => console.log(`${actionName} error:`, error));
            }
            break;
            
        case 'quality':
            console.log('Quality check test - click the Quality Check button to test manually');
            break;
            
        case 'bulk':
            console.log('Bulk actions test - click the Bulk Actions button to test manually');
            break;
            
        default:
            console.log('Available tests: notes, quality, bulk');
    }
};

console.log('\n💡 Usage: testPurchaseOrderAction("notes") to test specific actions');
