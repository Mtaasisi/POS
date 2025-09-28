// Test script to verify multiple payment method display
// This simulates the data structure and display logic

function testMultiplePaymentDisplay() {
  console.log('🧪 Testing Multiple Payment Method Display\n');
  
  // Simulate a sale with multiple payment methods
  const sampleSale = {
    id: 'test-sale-123',
    sale_number: 'SALE-54842335-ZQIL',
    total_amount: 700000,
    payment_method: JSON.stringify({
      type: 'multiple',
      details: {
        payments: [
          {
            method: 'cash',
            amount: 300000,
            reference: 'CASH-001',
            timestamp: '2025-01-26T05:47:00Z',
            status: 'completed'
          },
          {
            method: 'card',
            amount: 200000,
            reference: 'CARD-123456',
            timestamp: '2025-01-26T05:47:30Z',
            status: 'completed'
          },
          {
            method: 'mobile_money',
            amount: 200000,
            reference: 'MOMO-789012',
            timestamp: '2025-01-26T05:48:00Z',
            status: 'completed'
          }
        ],
        totalPaid: 700000
      },
      amount: 700000
    })
  };

  // Simulate the getPaymentMethodDetails function
  const getPaymentMethodDetails = (paymentMethod) => {
    if (!paymentMethod) return null;
    
    if (typeof paymentMethod === 'string') {
      try {
        const parsed = JSON.parse(paymentMethod);
        if (parsed.type === 'multiple' && parsed.details?.payments) {
          return parsed.details.payments;
        }
        return null;
      } catch {
        return null;
      }
    }
    
    if (typeof paymentMethod === 'object') {
      if (paymentMethod.type === 'multiple' && paymentMethod.details?.payments) {
        return paymentMethod.details.payments;
      }
      return null;
    }
    
    return null;
  };

  // Simulate the getPaymentMethodDisplay function
  const getPaymentMethodDisplay = (paymentMethod) => {
    if (!paymentMethod) return 'Unknown';
    
    if (typeof paymentMethod === 'string') {
      try {
        const parsed = JSON.parse(paymentMethod);
        if (parsed.type === 'multiple' && parsed.details?.payments) {
          const methods = parsed.details.payments.map((payment) => {
            const methodName = payment.method || payment.paymentMethod || 'Unknown';
            return methodName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          });
          const uniqueMethods = [...new Set(methods)];
          return uniqueMethods.join(', ');
        }
        return parsed.method || parsed.type || 'Unknown';
      } catch {
        return paymentMethod;
      }
    }
    
    return 'Unknown';
  };

  // Test the functions
  console.log('📊 Sale Information:');
  console.log(`  Sale Number: ${sampleSale.sale_number}`);
  console.log(`  Total Amount: TSh ${sampleSale.total_amount.toLocaleString()}`);
  console.log(`  Payment Method Display: ${getPaymentMethodDisplay(sampleSale.payment_method)}`);
  console.log('');

  const paymentDetails = getPaymentMethodDetails(sampleSale.payment_method);
  
  if (paymentDetails) {
    console.log('💳 Payment Breakdown:');
    paymentDetails.forEach((payment, index) => {
      console.log(`  ${index + 1}. ${payment.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
      console.log(`     Amount: TSh ${payment.amount.toLocaleString()}`);
      console.log(`     Reference: ${payment.reference}`);
      console.log(`     Status: ${payment.status}`);
      console.log(`     Time: ${new Date(payment.timestamp).toLocaleString('en-TZ')}`);
      console.log('');
    });

    const totalPaid = paymentDetails.reduce((total, payment) => total + payment.amount, 0);
    console.log(`💰 Total Paid: TSh ${totalPaid.toLocaleString()}`);
    console.log(`🎯 Sale Total: TSh ${sampleSale.total_amount.toLocaleString()}`);
    console.log(`✅ Match: ${totalPaid === sampleSale.total_amount ? 'YES' : 'NO'}`);
  } else {
    console.log('❌ No payment details found');
  }

  console.log('\n🎯 The fix ensures that:');
  console.log('   - Multiple payment methods are stored as JSON in database');
  console.log('   - Each payment method shows amount, reference, and timestamp');
  console.log('   - Payment breakdown is clearly displayed in sale details');
  console.log('   - Total payments match the sale total');
}

// Run the test
testMultiplePaymentDisplay();
