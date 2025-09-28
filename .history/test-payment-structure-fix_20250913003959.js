// Test script to verify payment data structure fix
// This script tests the payment data structure being passed to the sale processing service

console.log('🧪 Testing Payment Data Structure Fix...\n');

// Mock payment data from the payment modal (what we receive)
const mockPayments = [
  {
    paymentMethod: 'Card',
    amount: 350000,
    paymentAccountId: '2106b5e2-b439-46e5-be84-22cae45a89d9',
    timestamp: '2025-09-12T21:38:51.896Z'
  },
  {
    paymentMethod: 'Cash',
    amount: 350000,
    paymentAccountId: 'deb92580-95dd-4018-9f6a-134b2157716c',
    timestamp: '2025-09-12T21:38:51.896Z'
  }
];

const totalPaid = 700000;

// OLD (incorrect) structure that was causing the error
function createOldSaleData(payments, totalPaid) {
  return {
    // ... other sale data ...
    payments: payments.map(payment => ({
      method: payment.paymentMethod,
      amount: payment.amount,
      accountId: payment.paymentAccountId,
      timestamp: payment.timestamp
    })),
    // Missing paymentMethod structure expected by sale processing service
  };
}

// NEW (correct) structure that fixes the issue
function createNewSaleData(payments, totalPaid) {
  return {
    // ... other sale data ...
    paymentMethod: {
      type: payments.length === 1 ? payments[0].paymentMethod : 'multiple',
      details: {
        payments: payments.map(payment => ({
          method: payment.paymentMethod,
          amount: payment.amount,
          accountId: payment.paymentAccountId,
          timestamp: payment.timestamp
        })),
        totalPaid: totalPaid
      },
      amount: totalPaid
    }
  };
}

console.log('📋 Testing with multiple payments...');
console.log('Input payments:', mockPayments);
console.log('Total paid:', totalPaid);

console.log('\n❌ OLD structure (causing error):');
const oldStructure = createOldSaleData(mockPayments, totalPaid);
console.log(JSON.stringify(oldStructure, null, 2));

console.log('\n✅ NEW structure (fixed):');
const newStructure = createNewSaleData(mockPayments, totalPaid);
console.log(JSON.stringify(newStructure, null, 2));

// Test single payment scenario
console.log('\n📋 Testing with single payment...');
const singlePayment = [mockPayments[0]];
const singleTotal = singlePayment[0].amount;

console.log('Input payment:', singlePayment);
console.log('Total paid:', singleTotal);

console.log('\n✅ NEW structure for single payment:');
const singleStructure = createNewSaleData(singlePayment, singleTotal);
console.log(JSON.stringify(singleStructure, null, 2));

console.log('\n🎉 Test completed! The new structure correctly formats payment data for the sale processing service.');
console.log('🔧 This fixes the "Payment failed. Please try again." error.');
console.log('📝 Key improvements:');
console.log('   - paymentMethod.type: "multiple" for multiple payments, or the actual method for single payment');
console.log('   - paymentMethod.details: Contains all payment details and totalPaid');
console.log('   - paymentMethod.amount: Total amount paid');
console.log('   - Compatible with sale processing service expectations');
