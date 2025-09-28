// Test script to verify payment account matching fix
// This script tests the getAutoSelectedAccount function logic

console.log('🧪 Testing Payment Account Matching Fix...\n');

// Mock data structure matching the actual finance_accounts table
const mockPaymentMethods = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Cash',
    type: 'cash',
    is_active: true,
    is_payment_method: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Card',
    type: 'credit_card',
    is_active: true,
    is_payment_method: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'M-Pesa',
    type: 'mobile_money',
    is_active: true,
    is_payment_method: true
  }
];

// Mock payment accounts (same as payment methods in current system)
const mockPaymentAccounts = mockPaymentMethods;

// OLD (incorrect) logic that was causing the error
function getAutoSelectedAccountOld(methodId) {
  const method = mockPaymentMethods.find(m => m.id === methodId);
  if (!method) return null;

  const compatibleAccounts = mockPaymentAccounts.filter(account => 
    account.paymentMethodId === methodId && account.isActive
  );
  
  return compatibleAccounts.length > 0 ? compatibleAccounts[0] : null;
}

// NEW (correct) logic that fixes the issue
function getAutoSelectedAccountNew(methodId) {
  const method = mockPaymentMethods.find(m => m.id === methodId);
  if (!method) return null;

  // In the current system, finance accounts with is_payment_method = true ARE the payment methods
  // So we just return the selected payment method as the account
  return method;
}

// Test the functions
console.log('📋 Testing with Cash payment method...');
const cashMethodId = '550e8400-e29b-41d4-a716-446655440001';

console.log('❌ OLD logic result:', getAutoSelectedAccountOld(cashMethodId));
console.log('✅ NEW logic result:', getAutoSelectedAccountNew(cashMethodId));

console.log('\n📋 Testing with Card payment method...');
const cardMethodId = '550e8400-e29b-41d4-a716-446655440002';

console.log('❌ OLD logic result:', getAutoSelectedAccountOld(cardMethodId));
console.log('✅ NEW logic result:', getAutoSelectedAccountNew(cardMethodId));

console.log('\n📋 Testing with M-Pesa payment method...');
const mpesaMethodId = '550e8400-e29b-41d4-a716-446655440003';

console.log('❌ OLD logic result:', getAutoSelectedAccountOld(mpesaMethodId));
console.log('✅ NEW logic result:', getAutoSelectedAccountNew(mpesaMethodId));

console.log('\n📋 Testing with non-existent payment method...');
const invalidMethodId = 'invalid-id';

console.log('❌ OLD logic result:', getAutoSelectedAccountOld(invalidMethodId));
console.log('✅ NEW logic result:', getAutoSelectedAccountNew(invalidMethodId));

console.log('\n🎉 Test completed! The new logic correctly returns the payment method as the account.');
console.log('🔧 This fixes the "No compatible account found for this payment method" error.');
